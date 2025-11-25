import Anthropic from '@anthropic-ai/sdk';
import type { ToolExecution, StreamEvent } from '@/types/chat';
import { prompt } from './prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Use fetch instead of Node.js https for Cloudflare Workers/Pages compatibility
  fetch: fetch,
});

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// MCP Server HTTP endpoint (Cloudflare Workers)
const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

// Cached tools list
let mcpTools: Anthropic.Messages.Tool[] = [];

/**
 * Fetch available tools from MCP server via HTTP
 */
async function fetchMCPTools() {
  if (!MCP_SERVER_URL) {
    throw new Error('MCP_SERVER_URL environment variable is not set. Please check your .env.local file.');
  }

  if (mcpTools.length > 0) {
    console.log('📦 Using cached MCP tools:', mcpTools.map(t => t.name).join(', '));
    return mcpTools;
  }

  console.log('🔍 Fetching MCP tools from:', `${MCP_SERVER_URL}/v1/tools`);
  try {
    const response = await fetch(`${MCP_SERVER_URL}/v1/tools`, {
      headers: {
        'x-authentication-secret': process.env.SHARED_SECRET || '',
      },
    });
    if (!response.ok) {
      console.error('❌ MCP server responded with:', response.status, response.statusText);
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }

    const data = await response.json() as { tools: Array<{ name: string; description: string; inputSchema: Anthropic.Messages.Tool.InputSchema }> };
    mcpTools = data.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    console.log('💡 MCP tools loaded:', mcpTools.map(t => t.name));
    return mcpTools;
  } catch (error) {
    console.error('❌ Failed to fetch MCP tools:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to MCP server at ${MCP_SERVER_URL}. Make sure the MCP server is running (npm run cf:dev in packages/mcp-server).`);
    }
    throw new Error('Could not connect to MCP server: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Execute a tool on the MCP server via HTTP
 */
async function executeMCPTool(name: string, args: Record<string, unknown>) {
  if (!MCP_SERVER_URL) {
    throw new Error('MCP_SERVER_URL environment variable is not set. Please check your .env.local file.');
  }

  console.log(`🔧 Executing MCP tool: ${name}`);
  console.log('📝 Tool arguments:', JSON.stringify(args, null, 2));

  try {
    const response = await fetch(`${MCP_SERVER_URL}/v1/tools/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authentication-secret': process.env.SHARED_SECRET || '',
      },
      body: JSON.stringify({ name, arguments: args }),
    });

    if (!response.ok) {
      console.error(`❌ Tool execution failed: ${response.status} ${response.statusText}`);
      throw new Error(`Tool execution failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Tool ${name} completed successfully`);
    console.log('📊 Result preview:', typeof result === 'object' ? JSON.stringify(result).slice(0, 200) + '...' : result);
    return result;
  } catch (error) {
    console.error('❌ Tool execution error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to MCP server at ${MCP_SERVER_URL}. Make sure the MCP server is running.`);
    }
    throw error;
  }
}

export async function* generateChatResponseStream(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): AsyncGenerator<StreamEvent> {
  const toolExecutions: ToolExecution[] = [];

  // Fetch available tools from MCP server
  const tools = await fetchMCPTools();

  // Build conversation history for Claude
  const messages: Anthropic.Messages.MessageParam[] = conversationHistory
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

  messages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    // Initial request to Claude with MCP tools
    let response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: prompt,
      tools,
      messages,
    });

    // Handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) break;

      // Track tool execution and notify client
      // Execute tool via HTTP (handles notification internally)
      const toolResult = await executeMCPTool(toolUseBlock.name, toolUseBlock.input as Record<string, unknown>);

      const toolExecution: ToolExecution = {
        toolName: toolUseBlock.name,
        args: toolUseBlock.input as Record<string, unknown>,
        timestamp: Date.now(),
        result: toolResult.content // Store raw result for debug mode
      };
      toolExecutions.push(toolExecution);

      // Yield tool start event
      yield { type: 'tool_start', data: toolExecution };

      // Yield tool complete event
      yield { type: 'tool_complete', data: { toolName: toolUseBlock.name } };

      // Send tool result back to Claude
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult.content),
          },
        ],
      });

      // Get next response from Claude
      response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        system: prompt,
        tools,
        messages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
    );

    const finalResponse = textContent?.text || 'No response generated';

    // Yield response
    yield { type: 'response', data: finalResponse };

    // Yield done with all tool executions
    yield { type: 'done', data: { toolExecutions } };
  } catch (error: unknown) {
    const errorMessage = (error instanceof Error ? error.message : String(error));

    if (errorMessage.includes('rate_limit') || errorMessage.includes('quota')) {
      console.error('❌ Claude API Rate Limit');
      console.error('💡 You have exceeded your Claude API rate limit.');
      console.error('📝 Solutions:');
      console.error('   1. Wait a few minutes and try again');
      console.error('   2. Check your usage at: https://console.anthropic.com/');
      throw new Error('API rate limit exceeded. Please wait a few minutes and try again.');
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('api_key')) {
      console.error('❌ Invalid Claude API Key');
      console.error('💡 Your Claude API key is invalid or not set.');
      console.error('📝 Solution: Check your ANTHROPIC_API_KEY in the environment');
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY');
    }

    console.error('❌ Claude API Error:', errorMessage);
    console.error('Full error:', error);
    throw error;
  }
}

// Keep non-streaming version for compatibility
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<{ response: string; toolExecutions: ToolExecution[] }> {
  const toolExecutions: ToolExecution[] = [];
  let response = '';

  for await (const event of generateChatResponseStream(userMessage, conversationHistory)) {
    if (event.type === 'tool_start') {
      toolExecutions.push(event.data);
    } else if (event.type === 'response') {
      response = event.data;
    }
  }

  return { response, toolExecutions };
}

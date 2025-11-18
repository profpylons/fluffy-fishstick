import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
  if (mcpTools.length > 0) return mcpTools;

  try {
    const response = await fetch(`${MCP_SERVER_URL}/v1/tools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }

    const data = await response.json() as { tools: Array<{ name: string; description: string; inputSchema: Anthropic.Messages.Tool.InputSchema }> };
    mcpTools = data.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    console.log('MCP tools loaded:', mcpTools.map(t => t.name));
    return mcpTools;
  } catch (error) {
    console.error('Failed to fetch MCP tools:', error);
    throw new Error('Could not connect to MCP server');
  }
}

/**
 * Execute a tool on the MCP server via HTTP
 */
async function executeMCPTool(name: string, args: Record<string, unknown>) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/v1/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, arguments: args }),
    });

    if (!response.ok) {
      throw new Error(`Tool execution failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Tool execution error:', error);
    throw error;
  }
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
) {
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
      max_tokens: 4096,
      system: `You are a helpful AI assistant specializing in video game data analytics. You have access to game data tools through the MCP protocol.

When users ask about games, use the available tools to:
- Search for games by name
- Get detailed information about specific games
- Filter games by year, platform, or genre
- Sort games by rating or release date
- List available genres and platforms

Be conversational, helpful, and provide clear, data-driven insights based on the data you retrieve.`,
      tools,
      messages,
    });

    // Handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) break;

      console.log('Tool call:', toolUseBlock.name, toolUseBlock.input);

      // Execute tool via HTTP
      const toolResult = await executeMCPTool(toolUseBlock.name, toolUseBlock.input as Record<string, unknown>);

      console.log('Tool result:', JSON.stringify(toolResult).substring(0, 200) + '...');

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
        max_tokens: 4096,
        system: `You are a helpful AI assistant specializing in video game data analytics.`,
        tools,
        messages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
    );

    return textContent?.text || 'No response generated';
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
      console.error('📝 Solution: Check your ANTHROPIC_API_KEY in .env.local');
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY in .env.local');
    }

    console.error('❌ Claude API Error:', errorMessage);
    console.error('Full error:', error);
    throw error;
  }
}

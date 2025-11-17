import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// MCP Client to connect to our MCP server
let mcpClient: Client | null = null;
let mcpTools: any[] = [];

async function initializeMCPClient() {
  if (mcpClient) return;

  mcpClient = new Client(
    {
      name: 'chat-app-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Connect to MCP server via stdio
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../../mcp-server/dist/index.js'],
  });

  await mcpClient.connect(transport);

  // Get available tools from MCP server
  const toolsList = await mcpClient.listTools();
  mcpTools = toolsList.tools.map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  console.log('MCP Client initialized with tools:', mcpTools.map(t => t.name));
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
) {
  // Initialize MCP client if not already done
  await initializeMCPClient();

  // Build conversation history for Claude
  const messages = conversationHistory
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
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: `You are a helpful AI assistant specializing in video game data analytics. You have access to game data tools through the MCP protocol.

When users ask about games, use the available tools to:
- Search for games by name
- Get detailed information about specific games
- Filter games by year, platform, or genre
- Sort games by rating or release date
- List available genres and platforms

Be conversational, helpful, and provide clear, data-driven insights based on the data you retrieve.`,
      tools: mcpTools,
      messages,
    });

    // Handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block: any) => block.type === 'tool_use'
      );

      if (!toolUseBlock) break;

      console.log('Tool call:', toolUseBlock.name, toolUseBlock.input);

      // Call MCP server tool
      const toolResult = await mcpClient!.callTool({
        name: toolUseBlock.name,
        arguments: toolUseBlock.input,
      });

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
        ] as any,
      });

      // Get next response from Claude
      response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: `You are a helpful AI assistant specializing in video game data analytics.`,
        tools: mcpTools,
        messages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block: any) => block.type === 'text'
    );

    return textContent?.text || 'No response generated';
  } catch (error: any) {
    const errorMessage = error?.message || String(error);

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

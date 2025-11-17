import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  fetchGameDataTool, 
  fetchGameDataZodSchema, 
  executeFetchGameData 
} from './mcp-tools.js';

// Create MCP server
const server = new McpServer(
  {
    name: 'rawg-game-data',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register the fetch_game_data tool using the converted schema
server.registerTool(
  fetchGameDataTool.name,
  {
    title: 'Fetch Game Data',
    description: fetchGameDataTool.description,
    inputSchema: fetchGameDataZodSchema,
  },
  async (args) => {
    try {
      // Use the shared executeFetchGameData function
      const result = await executeFetchGameData(args);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RAWG MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

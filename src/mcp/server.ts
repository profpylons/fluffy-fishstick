import { Hono } from 'hono';
import { z } from 'zod';
import { fetchGameData, executeCalculation, tools } from './tools';
import type { ToolDefinition } from '../types';

declare const console: {
  error(message?: any, ...optionalParams: any[]): void;
};

// Define the MCP server
const app = new Hono();

// Health check endpoint
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Game Analytics MCP Server is running' });
});

// List available tools
app.get('/.well-known/mcp/tools', (c) => {
  return c.json(tools);
});

// Handle tool execution
app.post('/.well-known/mcp/execute', async (c) => {
  try {
    const { tool, parameters } = await c.req.json();
    
    let result;
    switch (tool) {
      case 'fetch_game_data':
        result = await fetchGameData(parameters);
        break;
      case 'execute_calculation':
        result = executeCalculation(parameters);
        break;
      default:
        return c.json({ error: 'Tool not found' }, 404);
    }
    
    return c.json({ result });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error executing tool:', error);
    return c.json({ error: errorMessage }, 500);
  }
});

// Handle OpenAPI schema generation
app.get('/openapi.json', (c) => {
  const paths: Record<string, any> = {
    '/.well-known/mcp/tools': {
      get: {
        summary: 'List available tools',
        responses: {
          '200': {
            description: 'List of available tools',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Tool',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/.well-known/mcp/execute': {
      post: {
        summary: 'Execute a tool',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tool: { type: 'string' },
                  parameters: { type: 'object' },
                },
                required: ['tool', 'parameters'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tool execution result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: { type: 'any' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Tool not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
  };

  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Game Analytics MCP Server',
      version: '1.0.0',
      description: 'MCP server for game analytics with RAWG API integration',
    },
    paths,
    components: {
      schemas: {
        Tool: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parameters: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                properties: { type: 'object' },
                required: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  };

  return c.json(schema);
});

export const mcpServer = app;

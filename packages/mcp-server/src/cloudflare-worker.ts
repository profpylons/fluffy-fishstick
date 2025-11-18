/**
 * Cloudflare Workers wrapper for MCP Server
 * 
 * This is a thin HTTP adapter that exposes the MCP tools
 * via HTTP endpoints for Cloudflare AI Gateway integration.
 * 
 * Note: This bypasses the stdio-based MCP server and calls
 * tool execution directly, since Workers use HTTP not stdio.
 */

import { fetchGameDataTool, executeFetchGameData } from './mcp-tools.js';
import { setApiKey } from './rawg.js';

// CORS headers for AI Gateway
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * Handle health check endpoint
 */
function handleHealth(): Response {
  return new Response('OK', { status: 200, headers: CORS_HEADERS });
}

/**
 * Handle tools list endpoint - returns available MCP tools
 */
function handleToolsList(): Response {
  const tools = [{
    name: fetchGameDataTool.name,
    description: fetchGameDataTool.description,
    inputSchema: fetchGameDataTool.parameters,
  }];

  return new Response(
    JSON.stringify({ tools }), 
    { headers: CORS_HEADERS }
  );
}

/**
 * Handle tool execution endpoint - executes a specific tool
 */
async function handleToolExecution(request: Request, env: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { name, arguments: args } = body;

    // Validate tool name
    if (name !== fetchGameDataTool.name) {
      return new Response(
        JSON.stringify({ error: `Unknown tool: ${name}` }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Execute the tool using existing logic
    const result = await executeFetchGameData(args);

    // Return in MCP format
    return new Response(
      JSON.stringify({
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Handle .well-known/mcp endpoint - MCP server discovery
 */
function handleWellKnown(): Response {
  return new Response(
    JSON.stringify({
      protocol: 'mcp',
      version: '1.0.0',
      server: {
        name: 'rawg-game-data',
        version: '1.0.0',
        description: 'MCP server for RAWG video game data',
      },
      capabilities: {
        tools: true,
      },
      endpoints: {
        tools: '/v1/tools',
        execute: '/v1/tools/execute',
      },
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Handle root endpoint - returns basic server info
 */
function handleRoot(): Response {
  return new Response(
    JSON.stringify({
      name: 'RAWG MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server for video game data',
      discovery: '/.well-known/mcp',
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Main Cloudflare Workers entry point
 */
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Set API key from Workers environment
    if (env.RAWG_API_KEY) {
      setApiKey(env.RAWG_API_KEY);
    }

    const url = new URL(request.url);

    // Route to appropriate handler
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (url.pathname === '/.well-known/mcp') {
      return handleWellKnown();
    }

    if (url.pathname === '/health') {
      return handleHealth();
    }

    if (url.pathname === '/v1/tools') {
      return handleToolsList();
    }

    if (url.pathname === '/v1/tools/execute' && request.method === 'POST') {
      return handleToolExecution(request, env);
    }

    return handleRoot();
  },
};

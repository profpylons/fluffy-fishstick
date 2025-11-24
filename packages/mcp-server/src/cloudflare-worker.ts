/**
 * Cloudflare Workers wrapper for MCP Server
 *
 * This is a thin HTTP adapter that exposes the MCP tools
 * via HTTP endpoints for Cloudflare AI Gateway integration.
 *
 * Note: This bypasses the stdio-based MCP server and calls
 * tool execution directly, since Workers use HTTP not stdio.
 */

import { fetchGameDataTool, executeFetchGameData } from './tools/fetch-game-data.js';
import { executeCalculationTool, executeCalculation } from './tools/execute-calculation.js';
import { setApiKey } from './tools/rawg.js';

// CORS headers for AI Gateway
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-authentication-secret',
  'Content-Type': 'application/json',
};

/**
 * Validate authentication secret from request header
 */
function isAuthenticated(request: Request, env: any): boolean {
  const expectedSecret = env.SHARED_SECRET;
  if (!expectedSecret) {
    console.warn('⚠️ SHARED_SECRET not configured in environment');
    return true; // Allow if not configured (development mode)
  }

  const providedSecret = request.headers.get('x-authentication-secret');
  return providedSecret === expectedSecret;
}

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
function handleToolsList(request: Request, env: any): Response {
  if (!isAuthenticated(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const tools = [
    {
      name: fetchGameDataTool.name,
      description: fetchGameDataTool.description,
      inputSchema: fetchGameDataTool.parameters,
    },
    {
      name: executeCalculationTool.name,
      description: executeCalculationTool.description,
      inputSchema: executeCalculationTool.parameters,
    }
  ];

  return new Response(
    JSON.stringify({ tools }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Handle tool execution endpoint - executes a specific tool
 */
async function handleToolExecution(request: Request, env: any): Promise<Response> {
  if (!isAuthenticated(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await request.json() as any;
    const { name, arguments: args } = body;

    console.log(`Executing tool: ${name}`, JSON.stringify(args, null, 2));

    let result;

    // Execute the appropriate tool
    if (name === fetchGameDataTool.name) {
      result = await executeFetchGameData(args);
    } else if (name === executeCalculationTool.name) {
      result = await executeCalculation(args);
    } else {
      console.error(`Unknown tool requested: ${name}`);
      return new Response(
        JSON.stringify({ error: `Unknown tool: ${name}` }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.log(`Tool ${name} executed successfully`);

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
      return handleToolsList(request, env);
    }

    if (url.pathname === '/v1/tools/execute' && request.method === 'POST') {
      return handleToolExecution(request, env);
    }

    return handleRoot();
  },
};

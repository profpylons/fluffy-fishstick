# Cloudflare AI Gateway MCP Deployment Guide

## Compatibility Assessment

### ❌ Current Incompatibilities

| Feature | Current | Cloudflare Needs | Status |
|---------|---------|------------------|--------|
| **Transport** | stdio (StdioServerTransport) | HTTP/SSE | ❌ Incompatible |
| **Runtime** | Node.js | Workers (V8 isolates) | ⚠️ Needs adaptation |
| **Process Model** | Long-running | Serverless/stateless | ❌ Incompatible |
| **File System** | Available | Not available | ✅ Not used |
| **Environment** | process.env | Workers env binding | ⚠️ Needs change |

### ✅ What Works

- ✅ MCP SDK core logic
- ✅ Tool definitions (JSON Schema)
- ✅ Zod validation
- ✅ HTTP requests (RAWG API)
- ✅ Business logic (`executeFetchGameData`)

## Cloudflare AI Gateway MCP Architecture

Cloudflare's AI Gateway MCP support expects:

```
AI Model (via Gateway)
    ↓ HTTP/SSE
Cloudflare Workers MCP Server
    ↓
Your Tools (RAWG API)
```

## Required Changes

### 1. Transport Layer

**stdio**:

```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

**HTTP**:
Cloudflare AI Gateway handles the MCP protocol via HTTP:

- Expose HTTP endpoints
- Handle MCP protocol messages
- Return responses in MCP format

### 2. Runtime Adaptation

**Changes needed**:
- Remove Node.js-specific imports
- Use Workers APIs (fetch, env bindings)
- Handle stateless execution

### 3. Environment Variables

**Current**:
```typescript
process.env.RAWG_API_KEY
```

**Cloudflare**:
```typescript
env.RAWG_API_KEY  // From wrangler.toml or dashboard
```

## Deployment Options

### Option A: Use Cloudflare's MCP Gateway (Simplest)

Cloudflare AI Gateway can connect to MCP servers via:
1. **SSE (Server-Sent Events)** - For streaming
2. **HTTP** - For request/response

**Your server needs to**:
1. Expose MCP protocol endpoints
2. Handle tool discovery
3. Handle tool execution

**Cloudflare handles**:
- Protocol translation
- AI model integration
- Caching and routing

### Option B: Hybrid Approach (Recommended)

Keep two versions:

```
packages/mcp-server/
├── src/
│   ├── mcp-server.ts          # stdio version (for local/Claude Desktop)
│   ├── cloudflare-worker.ts   # HTTP version (for Cloudflare)
│   ├── mcp-tools.ts            # Shared tool logic ✅
│   └── rawg.ts                 # Shared API client ✅
```

## Implementation Steps

### Step 1: Create Cloudflare Worker Version

```typescript
// packages/mcp-server/src/worker.ts
export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // MCP protocol endpoints
    if (url.pathname === '/v1/tools') {
      return handleToolsList(env);
    }

    if (url.pathname === '/v1/tools/execute') {
      return handleToolExecution(request, env);
    }

    return new Response('MCP Server', { status: 200 });
  }
};

async function handleToolsList(env: any) {
  return new Response(JSON.stringify({
    tools: [{
      name: 'fetch_game_data',
      description: fetchGameDataTool.description,
      inputSchema: fetchGameDataTool.parameters,
    }]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleToolExecution(request: Request, env: any) {
  const { tool, arguments: args } = await request.json();

  // Execute tool with env for API keys
  const result = await executeFetchGameData(args, env.RAWG_API_KEY);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Step 2: Update Tool Execution for Workers

Modify `mcp-tools.ts` to accept API key as parameter:

```typescript
export async function executeFetchGameData(args: any, apiKey?: string) {
  const key = apiKey || process.env.RAWG_API_KEY;
  // Use key in RAWG API calls
}
```

### Step 3: Create wrangler.toml

```toml
name = "rawg-mcp-server"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.secrets]]
# Set via: wrangler secret put RAWG_API_KEY
```

### Step 4: Deploy

```bash
cd packages/mcp-server
npm install -g wrangler
wrangler login
wrangler secret put RAWG_API_KEY
wrangler deploy
```

### Step 5: Configure Cloudflare AI Gateway

In Cloudflare Dashboard:
1. Go to AI Gateway
2. Add MCP Server
3. Enter your Worker URL
4. Configure authentication

## Limitations & Considerations

### 1. Stateless Execution
- No persistent connections
- Each request is independent
- Can't maintain conversation state in server

### 2. Cold Starts
- First request may be slower
- Subsequent requests are fast
- Consider warming strategies

### 3. Timeout Limits
- Workers have execution time limits
- RAWG API calls must complete quickly
- Consider caching

### 4. Cost
- Workers: $5/month for 10M requests
- AI Gateway: Free tier available
- RAWG API: Check rate limits

## Alternative: Use Cloudflare AI Gateway Directly

Instead of deploying your MCP server, you could:

1. **Use Cloudflare's built-in MCP features**
2. **Create Workers AI functions** that call RAWG
3. **Let AI Gateway handle MCP protocol**

This might be simpler if Cloudflare provides RAWG integration.

## Recommendation

### For Your Use Case:

**Short term**: Keep stdio version for local development and Claude Desktop

**Long term**: Create HTTP version for Cloudflare when:
- You need public access
- You want to use Cloudflare AI Gateway
- You need scalability

### Hybrid Setup:

```
Local Development:
  Claude Desktop → stdio MCP server

Production:
  AI Gateway → HTTP MCP Worker → RAWG API
```

## Next Steps

1. **Test current setup** with stdio transport
2. **Evaluate Cloudflare AI Gateway** features
3. **Create HTTP version** if needed
4. **Deploy to Workers** when ready

## Resources

- [Cloudflare AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Summary

**Current server**: ❌ Not directly compatible (uses stdio)
**Effort to adapt**: ⚠️ Moderate (need HTTP version)
**Shared code**: ✅ 80% reusable (tools, logic, API client)
**Recommendation**: Create parallel HTTP version for Cloudflare

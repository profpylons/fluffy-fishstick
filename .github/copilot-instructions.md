# Game Data Chat - AI Agent Instructions

## Project Overview

This is a **monorepo** containing an AI-powered game data analytics chat application with two packages:

- **`packages/chat-app/`** - Next.js 16 app (deployed to Cloudflare Pages)
- **`packages/mcp-server/`** - MCP (Model Context Protocol) server (deployed to Cloudflare Workers)

**Architecture**: Next.js chat UI → Claude AI (Anthropic) → HTTP MCP Server → RAWG API for game data

## Critical Architecture Principles

### 1. Single Source of Truth for Tool Definitions

**NEVER duplicate tool schemas**. Each tool is defined ONCE in `packages/mcp-server/src/tools/[tool-name].ts`:

```typescript
// Example: packages/mcp-server/src/tools/fetch-game-data.ts
export const fetchGameDataTool = {
  name: 'fetch_game_data',
  description: '...',
  parameters: { /* JSON Schema */ }
};

export function convertToZodSchema(toolDef) { /* ... */ }
export async function executeFetchGameData(args) { /* ... */ }
```

**Flow**: JSON Schema → `convertToZodSchema()` → Zod validation → execution function

### 2. Dual Transport Architecture

The MCP server supports TWO transport modes sharing the same tool logic:

- **`src/cloudflare-worker.ts`** - HTTP transport for Cloudflare Workers (production)
- **`src/mcp-server.ts`** - stdio transport for local development/Claude Desktop

Both import and execute the same tools from `src/tools/`.

### 3. HTTP MCP Protocol

The chat app communicates with the MCP server via HTTP (not stdio):

1. **List tools**: `GET ${MCP_SERVER_URL}/v1/tools` returns available tools
2. **Execute tool**: `POST ${MCP_SERVER_URL}/v1/tools/execute` with `{ name, arguments }`

See `packages/chat-app/src/lib/claude-mcp.ts` for implementation.

## Development Workflows

### Local Development

Start both servers from project root:

```bash
# Terminal 1 - MCP Server (port 8787)
cd packages/mcp-server && npm run cf:dev

# Terminal 2 - Chat App (port 3000)
cd packages/chat-app && npm run dev
```

**Environment Setup**:
- `packages/chat-app/.env` - `ANTHROPIC_API_KEY`, `MCP_SERVER_URL=http://localhost:8787`
- `packages/mcp-server/.dev.vars` - `RAWG_API_KEY`

### Testing

**MCP Server tests** (Jest with coverage):
```bash
cd packages/mcp-server
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

Tests are in `src/tools/__tests__/` and cover tool definitions, schema validation, and execution logic.

### Deployment

**MCP Server** (Cloudflare Workers):
```bash
cd packages/mcp-server
wrangler secret put RAWG_API_KEY  # Set secret (once)
npm run deploy                    # Deploy to production
```

**Chat App** (Cloudflare Pages):
Build with `npm run build`, deploy via Cloudflare Pages dashboard, set `ANTHROPIC_API_KEY` and `MCP_SERVER_URL` in environment variables.

## Key Patterns & Conventions

### Error Handling

**Console logs**: Use emoji indicators for visibility:
- ❌ Errors
- 💡 Important info
- 📝 Debug info

**User-facing errors**: Friendly messages in chat responses (see `packages/chat-app/src/app/api/chat/route.ts`)

### React Component Patterns

**Client components** require `'use client'` directive. Handle hydration for timestamp/locale-specific rendering:

```typescript
const [timeString, setTimeString] = useState<string>('');
useEffect(() => {
  setTimeString(new Date(timestamp).toLocaleTimeString());
}, [timestamp]);
```

### Tool Execution Tracking

The UI tracks tool execution in real-time via SSE (Server-Sent Events):
- `generateChatResponseStream()` yields `tool_start` and `tool_complete` events
- `ChatInterface` consumes SSE stream and updates tool badges on messages in real-time
- Tool executions stored in `Message.toolExecutions` array
- Blue badges display above message content showing which tools were used

See `packages/chat-app/src/lib/claude-mcp.ts` (streaming) and `packages/chat-app/src/components/ChatInterface.tsx` (consumption).

### MCP Server Imports

**ALWAYS use `.js` extensions** in MCP server imports (ESM requirement):

```typescript
import { executeFetchGameData } from './tools/fetch-game-data.js';
```

## Adding New MCP Tools

1. **Create tool file**: `packages/mcp-server/src/tools/new-tool.ts`
   - Export tool definition (JSON Schema)
   - Export Zod schema (via `convertToZodSchema` or manual)
   - Export execution function

2. **Register in HTTP handler**: `packages/mcp-server/src/cloudflare-worker.ts`
   - Add to `handleToolsList()`
   - Add case in `handleToolExecution()`

3. **Register in stdio handler**: `packages/mcp-server/src/mcp-server.ts`
   - Import tool and add to server registration

4. **Add tests**: `packages/mcp-server/src/tools/__tests__/new-tool.test.ts`

## Tech Stack Notes

- **Next.js 16**: App Router, React 19, TypeScript strict mode, Tailwind CSS 4
- **MCP SDK**: `@modelcontextprotocol/sdk` v1.22+ for tool protocol
- **Cloudflare**: Workers (MCP server), Pages (Next.js app), `wrangler` CLI
- **APIs**: Anthropic Claude Sonnet 4, RAWG Video Games Database API
- **Testing**: Jest with `NODE_OPTIONS=--experimental-vm-modules` for ESM support

## Anti-Patterns to Avoid

❌ **Don't** duplicate tool schemas between MCP server and chat app
❌ **Don't** use `any` type except in error handlers
❌ **Don't** forget `.js` extensions in MCP server imports
❌ **Don't** commit secrets (use `.dev.vars` locally, `wrangler secret` for production)
❌ **Don't** add generic comments - only document non-obvious logic
❌ **Don't** declare types/interfaces partway through files. Always declare them in a file in a `types/` directory at the top level of the package.

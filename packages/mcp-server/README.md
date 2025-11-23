# MCP Server

Model Context Protocol server providing game data tools via RAWG API.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

**For stdio server (local development):**

```bash
# Create .env.local in project root
cp ../../env.template .env.local
# Add your RAWG_API_KEY
```

**For Cloudflare Workers (local testing):**

```bash
# Create .dev.vars file
cp .dev.vars.example .dev.vars
# Add your RAWG_API_KEY
```

### 3. Run

**stdio server (for Claude Desktop, local development):**

```bash
npm run dev
```

**Cloudflare Workers (local testing):**

```bash
npm run cf:dev
```

## Testing

Run the test suite to verify tool functionality:

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

The test suite includes:
- **execute-calculation tool** - Comprehensive tests for sum, average, and standard deviation calculations
- **fetch-game-data tool** - Tests for tool definition, schema validation, and parameter structure

## Deployment

### Production Secrets

**Never commit secrets!** Use Wrangler's secret management:

```bash
# Set production secret
wrangler secret put RAWG_API_KEY
# Enter your key when prompted
```

### Deploy to Cloudflare

```bash
npm run deploy
```

## Architecture

Two transport implementations sharing the same tool logic:

- **stdio** (`mcp-server.ts`) - For local development and desktop clients
- **HTTP** (`cloudflare-worker.ts`) - For Cloudflare Workers deployment

Both use:
- `mcp-tools.ts` - Tool definitions and execution
- `rawg.ts` - RAWG API client

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAWG_API_KEY` | Yes | API key from https://rawg.io/apidocs |

## Files

- `src/mcp-server.ts` - stdio MCP server
- `src/cloudflare-worker.ts` - HTTP adapter for Workers
- `src/mcp-tools.ts` - Tool definitions (single source of truth)
- `src/rawg.ts` - RAWG API client
- `wrangler.toml` - Cloudflare Workers configuration
- `.dev.vars` - Local secrets (gitignored)
- `.dev.vars.example` - Template for local secrets

## Security

✅ **DO:**
- Use `.dev.vars` for local development
- Use `wrangler secret` for production
- Keep `.dev.vars` in `.gitignore`

❌ **DON'T:**
- Put secrets in `wrangler.toml`
- Commit `.dev.vars` to git
- Hardcode API keys in code

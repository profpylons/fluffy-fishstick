# Quick Setup Guide

## ✅ What's Been Built

A complete LLM chat application for game data analytics with:

- **Chat Interface**: Modern, responsive UI with message history
- **AI Integration**: Claude AI (Anthropic) with tool calling via MCP
- **MCP Server**: Cloudflare Workers-based MCP server with game data tools
- **Data Source**: RAWG API integration for game data
- **TypeScript**: Fully typed codebase
- **Monorepo Structure**: Organized with chat-app and mcp-server packages
- **Cloudflare Ready**: Configured for Cloudflare Pages and Workers deployment

## 🚀 Next Steps

### 1. Set Up API Keys

#### Chat App Configuration

Navigate to the chat-app package and copy the environment template:
```bash
cd packages/chat-app
cp env.example .env
```

Edit `packages/chat-app/.env` and add your API keys:

**Get Claude API Key:**
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new API key
5. Copy the key to `.env`

#### MCP Server Configuration

Navigate to the mcp-server package and copy the environment template:
```bash
cd packages/mcp-server
cp env.example .dev.vars
```

Edit `packages/mcp-server/.dev.vars` and add your RAWG API key:

**Get RAWG API Key:**
1. Go to https://rawg.io/apidocs
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the key to `.dev.vars`

### 2. Test Locally

Start both the MCP server and chat app:

**Terminal 1 - Start MCP Server:**
```bash
cd packages/mcp-server
npm run cf:dev
```

The MCP server will run at http://localhost:8787

**Terminal 2 - Start Chat App:**
```bash
cd packages/chat-app
npm run dev
```

The chat app will run at http://localhost:3000

Try asking questions like:
- "Show me the top rated games from 2023"
- "What are the most popular games?"
- "Tell me about RPG games"

### 3. Deploy to Cloudflare

#### Deploy MCP Server (Cloudflare Workers)

```bash
cd packages/mcp-server

# Set your RAWG API key as a secret
npx wrangler secret put RAWG_API_KEY

# Deploy to Cloudflare Workers
npm run deploy
```

Note your Worker URL (currently, `https://rawg-mcp-server.profpylons.workers.dev`)

#### Deploy Chat App (Cloudflare Pages)

```bash
cd packages/chat-app

# Build the application
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .next
```

Set environment variables in Cloudflare Pages Dashboard:
- Go to your Pages project
- Navigate to Settings > Environment Variables
- Add `ANTHROPIC_API_KEY` with your Claude API key
- Add `MCP_SERVER_URL` with your Worker URL from above

## 📁 Project Structure

```
game-data-chat/
├── packages/
│   ├── chat-app/                 # Next.js chat application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/chat/route.ts    # Chat API endpoint
│   │   │   │   ├── page.tsx              # Main page
│   │   │   │   └── layout.tsx            # App layout
│   │   │   ├── components/
│   │   │   │   ├── ChatInterface.tsx     # Main chat component
│   │   │   │   ├── ChatMessage.tsx       # Message display
│   │   │   │   └── ChatInput.tsx         # Input field
│   │   │   ├── lib/
│   │   │   │   ├── claude-mcp.ts         # Claude AI with MCP integration
│   │   │   │   └── rawg.ts               # RAWG API client (legacy)
│   │   │   └── types/
│   │   │       └── chat.ts               # TypeScript types
│   │   ├── env.example                   # Chat app environment template
│   │   └── package.json
│   │
│   └── mcp-server/               # Cloudflare Workers MCP server
│       ├── src/
│       │   ├── cloudflare-worker.ts      # Main worker entry point
│       │   ├── rawg.ts                   # RAWG API integration
│       │   └── index.ts                  # Standalone MCP server
│       ├── env.example                   # MCP server environment template
│       ├── wrangler.toml                 # Cloudflare Workers config
│       └── package.json
│
├── README.md                     # Full documentation
├── SETUP_GUIDE.md                # This file
├── MCP_INTEGRATION.md            # MCP integration guide
└── CLOUDFLARE_DEPLOYMENT.md      # Deployment guide
```

## 🎯 Features

- Real-time chat with Claude AI
- **HTTP-based MCP integration** - Claude calls tools via Cloudflare Workers
- Automatic game data fetching from RAWG API
- Clean, modern UI with Tailwind CSS
- Dark mode support
- TypeScript for type safety
- Optimized for Cloudflare deployment (Pages + Workers)
- Monorepo structure for better organization

## 📖 Documentation

- **[README.md](./README.md)** - Main project documentation
- **[MCP_INTEGRATION.md](./MCP_INTEGRATION.md)** - Detailed MCP integration guide
- **[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)** - Deployment guide
- **[packages/chat-app/env.example](./packages/chat-app/env.example)** - Chat app environment template
- **[packages/mcp-server/env.example](./packages/mcp-server/env.example)** - MCP server environment template

## 🔧 Customization

To customize the AI behavior, edit:
- `packages/chat-app/src/lib/claude-mcp.ts` - Modify the system prompt and Claude integration
- `packages/mcp-server/src/cloudflare-worker.ts` - Add new MCP tools or modify existing ones
- `packages/chat-app/src/components/ChatInterface.tsx` - Update UI and styling

## 📝 Notes

- The chat app uses Next.js 16 with the App Router
- Claude Sonnet 4 (2025-05-14) model with tool calling
- MCP (Model Context Protocol) via HTTP for tool integration
- RAWG API has rate limits on the free tier
- For production, consider adding error boundaries and loading states
- The MCP server runs as a Cloudflare Worker for serverless scalability

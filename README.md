# Game Data Analytics Chat

An AI-powered chat application for analyzing video game data using the RAWG API and Claude AI with Model Context Protocol (MCP) integration.

## Features

- 🤖 Conversational AI powered by Claude (Anthropic)
- 🔧 **MCP (Model Context Protocol)** integration with `fetch_game_data` and `execute_calculation` tools
- 🎮 Real-time game data from RAWG API
- 📊 Statistical calculations (sum, average, standard deviation)
- 💬 Clean, modern chat interface
- 🌙 Dark mode support
- ⚡ Built with Next.js 16 and TypeScript
- ☁️ Cloudflare deployment ready (Pages + Workers)

## Project Structure

This is a monorepo with two packages:

- **`packages/chat-app/`** - Next.js chat application (Cloudflare Pages)
- **`packages/mcp-server/`** - MCP server running on Cloudflare Workers

## Setup

### 1. Install Dependencies

From the root directory:

### 2. Configure Chat App

Navigate to the chat app and set up environment variables:

Copy `packages/chat-app/env.example` to `packages/chat-app/.env` and configure:

- **ANTHROPIC_API_KEY** - Get from https://console.anthropic.com/
- **MCP_SERVER_URL** - Use `http://localhost:8787` for local development

### 3. Configure MCP Server

Navigate to the MCP server and set up environment variables:

Copy `packages/mcp-server/env.example` to `packages/mcp-server/.dev.vars` and configure:

- **RAWG_API_KEY** - Get from https://rawg.io/apidocs

### 4. Run Development Servers

**Terminal 1 - Start MCP Server:**

The MCP server will run at http://localhost:8787

**Terminal 2 - Start Chat App:**

The chat app will run at http://localhost:3000

## Usage

Ask questions about games and perform calculations:
- "Show me the top rated games from 2023"
- "What are the most popular games right now?"
- "Tell me about games in the RPG genre"
- "Calculate the average of these numbers: 10, 20, 30, 40"

The AI uses MCP tools to fetch game data from RAWG API and perform statistical calculations. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed documentation.

## Deploy to Cloudflare

### Deploy MCP Server (Workers)

Set your RAWG API key as a secret, then deploy.

### Deploy Chat App (Pages)

Build and deploy the Next.js application.

Set environment variables in Cloudflare Pages Dashboard:
- **ANTHROPIC_API_KEY** - Your Claude API key
- **MCP_SERVER_URL** - Your deployed Worker URL

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed deployment instructions.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude (Anthropic) with MCP
- **Data Source**: RAWG Video Games Database API
- **Deployment**: Cloudflare Pages + Workers
- **MCP Tools**: Game data fetching, statistical calculations

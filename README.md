# Game Data Analytics Chat

An AI-powered chat application for analyzing video game data using the RAWG API and Claude AI with Model Context Protocol (MCP) integration.

## Features

### Authentication

Please provide a valid `clientToken=<yourtokenhere>` in the query string.

### Request Response Logging

Please provide `debug` flag in the query string to get a summary of the request sent to the server and full JSON response from it.

## Implementation Process Summary.

### Coding strategy

I've had Wndsurf downloaded for a couple of weeks, but not had a suitable standalone project to try it with. The solution
is mostly implemented by Windsurf/Cascade.

However, I didn't see a marked difference from Github Copilot, so near the end I reverted back to that. It has all my tools eg. linter highlights, setup already and so the code quality should be more consistent.

### Problems

Token limits and API overload. I've done some Bad Things™ to limit this....

1. I strip out the tags becuase they are a large and repetitive structure
2. I've promoted to limit to 2 pages maximum results (at page size 40)

(see below, next steps - it occured late on that I could add a tool to strip out all unnecessary fields based on the summarisation expected)

Prompt optimisation needs more work. I have tools and propmts that are not reliably called eg. I created a tool for rating averages (as they are weighted in the response), but the AI doesn't reliably recognise that it needs to be used.

Similarly, it doesn't reliably report standard deviation with the averages. (it was so sporadic that it's removed from the prompt now.)

### The major steps were:

1. Learn a little about the RAWG API and its capabilities
2. Created an app using Next.js and the built in chat component as a front-end to Google Gemini (Already had an API Key)
3. Created an integrated tool to query the RAWG API in the web app
4. Separated the MCP sever into its own HTTP server
5. Switched the model to Claude for better native tool support
6. Created a cloudflare deployment for the MCP server to call it remotely
7. [All the pieces are working end-to-end 🥳 Now I can extend features, improve usability & addd security]
8. Added the statistics tool with some tests
9. Did some intermediate prompt optimisation to [attempt to] keep the token usage down (better but not perfect)
10. Improved the feedback in the UI with Markdown, notice of tool use and making the raw data available with `?debug` querystring
11. Strip some unused properties from large responses to save tokens (and API rate limiting!)
12. Add some rudimentary "auth" with shared secrets

### What's next (if this was real)

1. Some real auth!! (OAuth, JWT)
2. Further token saving with an MCP tool to check which properties are necessary for the analysis and remove any others
3. Some observability to track token usage and guide prompt optimisation
4. Look at the performance to guide model, tool or prompt optimisation.
5. Have a chat with the people using it and see what's easy/difficult/missing.
6. Some more work on the UI, maybe even comparison charts.

## What Was Implemented (according to Claude)

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

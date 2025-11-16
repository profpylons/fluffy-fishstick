# Game Data Analytics Chat

An AI-powered chat application for analyzing video game data using the RAWG API and Google Gemini AI.

## Features

- 🤖 Conversational AI powered by Google Gemini
- 🔧 **MCP (Model Context Protocol)** integration with `fetch_game_data` tool
- 🎮 Real-time game data from RAWG API
- 📊 Data analytics and insights
- 💬 Clean, modern chat interface
- 🌙 Dark mode support
- ⚡ Built with Next.js and TypeScript

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
RAWG_API_KEY=your_rawg_api_key_here
```

**Get your API keys:**
- **Gemini API Key**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **RAWG API Key**: Get it from [RAWG API](https://rawg.io/apidocs)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

Ask questions about games, such as:
- "Show me the top rated games from 2023"
- "What are the most popular games right now?"
- "Tell me about games in the RPG genre"
- "What are the best games on PlayStation?"

The AI uses the MCP `fetch_game_data` tool to intelligently fetch relevant data from the RAWG API. See [MCP_INTEGRATION.md](./MCP_INTEGRATION.md) for details.

## Deploy to Cloudflare

This application can be deployed to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy .next
```

Make sure to set your environment variables in the Cloudflare dashboard.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini AI
- **Data Source**: RAWG Video Games Database API
- **Deployment**: Cloudflare Pages

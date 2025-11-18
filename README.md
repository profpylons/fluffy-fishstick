# Game Analytics MCP Server


This branch used the supplied documentation to see if it was possible to oneshot the code from the instructions.
It was a nice idea, but unfortunately, this did not work:

* This README refers to a `client` that does not exist (some plain HTML in its place?)
* The `server` seems to have multiple definitions for its endpoints
* No connection to any LLM
* And a myriad of other issues & oddities

The original README follows..

-----------

A Cloudflare Worker-based MCP server that provides tools for fetching and analyzing video game data from the RAWG API.

## Features

- **fetch_game_data**: Fetches game data from RAWG API with filtering options
- **execute_calculation**: Performs calculations on numeric data (sum, average, min, max, count)
- **Web-based UI** for interacting with the MCP server
- **Deployed on Cloudflare Workers** for serverless scalability

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- RAWG API key (get it from [RAWG API](https://rawg.io/apidocs))

## Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd game-analytics-mcp
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.dev.vars` file in the project root with your RAWG API key:
   ```
   RAWG_API_KEY=your_rawg_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev:server
   ```

## Deployment

1. Log in to Cloudflare Wrangler:
   ```bash
   npx wrangler login
   ```

2. Deploy the worker:
   ```bash
   npm run deploy
   ```

3. Set your RAWG API key as a secret in the Cloudflare dashboard:
   ```bash
   npx wrangler secret put RAWG_API_KEY
   ```

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── index.ts        # Main server entry point
│   │   └── tools.ts        # MCP tool definitions and schemas
├── client/
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── types/          # TypeScript type definitions
│       ├── utils/          # Utility functions
│       ├── App.tsx         # Main application component
│       └── main.tsx        # Application entry point
├── shared/                 # Shared code between client and server
├── .gitignore
├── package.json
├── tsconfig.json
└── wrangler.toml           # Cloudflare Workers configuration
```

## API Endpoints

### `GET /api/games`

Fetch game data from RAWG API.

**Query Parameters:**
- `genres` (optional): Comma-separated list of genre IDs
- `platforms` (optional): Comma-separated list of platform IDs
- `dates` (optional): Date range in format "start_date,end_date" (e.g., "2020-01-01,2020-12-31")
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Results per page (default: 20, max: 40)

### `POST /api/calculate`

Perform calculations on numeric data.

**Request Body:**
```json
{
  "operation": "average",
  "values": [85, 90, 88, 92],
  "property": "metacritic_score"
}
```

**Response:**
```json
{
  "success": true,
  "result": 88.75,
  "operation": "average",
  "property": "metacritic_score",
  "count": 4
}
```

## Example Queries

1. **Average Metacritic score for PC games in Q1 2024**
   ```
   fetch_game_data({
     platforms: "4",  // PC
     dates: "2024-01-01,2024-03-31"
   })
   ```
   Then use `execute_calculation` on the results.

2. **Most popular genre in 2023**
   ```
   fetch_game_data({
     dates: "2023-01-01,2023-12-31"
   })
   ```
   Then analyze the genres in the results.

## License

MIT

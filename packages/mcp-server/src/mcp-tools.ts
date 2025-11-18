import { z } from 'zod';
import { searchGames, getGameDetails, getGenres, getPlatforms } from './rawg';

// MCP Tool definition for Gemini function calling
export const fetchGameDataTool = {
  name: 'fetch_game_data',
  description: 'Fetch video game data from the RAWG API. Use this tool when users ask about games, ratings, platforms, genres, or any gaming statistics. You can search for games by name, filter by year, sort by rating or release date, and get detailed information.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['search', 'details', 'genres', 'platforms'],
        description: 'The action to perform: search for games, get game details, list genres, or list platforms',
      },
      search: {
        type: 'string',
        description: 'Search query for game names (used with action: search)',
      },
      game_id: {
        type: 'number',
        description: 'Game ID for getting details (used with action: details)',
      },
      page_size: {
        type: 'number',
        description: 'Number of results to return (default: 10, max: 40)',
      },
      ordering: {
        type: 'string',
        enum: ['-rating', '-released', '-added', '-created', '-updated', 'rating', 'released'],
        description: 'Sort order: -rating (highest rated), -released (newest), rating (lowest rated), released (oldest)',
      },
      dates: {
        type: 'string',
        description: 'Date range filter in format YYYY-MM-DD,YYYY-MM-DD (e.g., "2023-01-01,2023-12-31")',
      },
      platforms: {
        type: 'string',
        description: 'Platform IDs to filter by (comma-separated, e.g., "4,187" for PC and PlayStation)',
      },
      genres: {
        type: 'string',
        description: 'Genre IDs to filter by (comma-separated)',
      },
    },
    required: ['action'],
  },
};

// Convert JSON Schema parameters to Zod schema for MCP SDK
export function convertToZodSchema(toolDef: typeof fetchGameDataTool) {
  const { properties, required = [] } = toolDef.parameters;
  const zodSchema: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    const isRequired = required.includes(key);
    let schema: z.ZodTypeAny;

    // Handle different types
    if ('enum' in prop && prop.enum) {
      // Enum type
      schema = z.enum(prop.enum as [string, ...string[]]);
    } else if (prop.type === 'string') {
      schema = z.string();
    } else if (prop.type === 'number') {
      schema = z.number();
    } else if (prop.type === 'boolean') {
      schema = z.boolean();
    } else {
      schema = z.any();
    }

    // Add description if available
    if (prop.description) {
      schema = schema.describe(prop.description);
    }

    // Make optional if not required
    if (!isRequired) {
      schema = schema.optional();
    }

    zodSchema[key] = schema;
  }

  return zodSchema;
}

// Export the Zod schema for the tool
export const fetchGameDataZodSchema = convertToZodSchema(fetchGameDataTool);

// Function to execute the tool
export async function executeFetchGameData(args: any) {
  const { action, search, game_id, page_size, ordering, dates, platforms, genres } = args;

  try {
    let result;

    switch (action) {
      case 'search':
        result = await searchGames({
          search,
          page_size: page_size || 10,
          ordering,
          dates,
          platforms,
          genres,
        });
        break;

      case 'details':
        if (!game_id) {
          throw new Error('game_id is required for details action');
        }
        result = await getGameDetails(game_id);
        break;

      case 'genres':
        result = await getGenres();
        break;

      case 'platforms':
        result = await getPlatforms();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return result;
  } catch (error: any) {
    throw new Error(`Error executing fetch_game_data: ${error.message}`);
  }
}

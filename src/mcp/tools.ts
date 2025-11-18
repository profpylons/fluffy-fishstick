import { Game, FetchGameDataParams, ExecuteCalculationParams, GameListResponse, ToolDefinition } from '../types';

declare const URLSearchParams: {
    new (init?: string[][] | Record<string, string> | string | URLSearchParams | undefined, 
         nameValuePairs?: any): URLSearchParams;
    prototype: URLSearchParams;
    toString(): string;
};

const RAWG_API_KEY = 'YOUR_RAWG_API_KEY'; // Will be set via environment variables
const RAWG_API_URL = 'https://api.rawg.io/api/games';

export const fetchGameData = async (params: FetchGameDataParams): Promise<GameListResponse> => {
  const queryParams = new URLSearchParams();
  
  // Add filters if provided
  if (params.genres) queryParams.append('genres', params.genres);
  if (params.platforms) queryParams.append('platforms', params.platforms);
  if (params.dates) queryParams.append('dates', params.dates);
  
  // Add pagination
  queryParams.append('page', (params.page || 1).toString());
  queryParams.append('page_size', (params.page_size || 20).toString());
  
  // Add API key
  queryParams.append('key', RAWG_API_KEY);
  
  const response = await globalThis.fetch(`${RAWG_API_URL}?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch game data: ${response.statusText}`);
  }
  
  return response.json();
};

export const executeCalculation = (params: ExecuteCalculationParams): number => {
  const { operation, field, data } = params;
  
  if (!data.length) return 0;
  
  switch (operation) {
    case 'average':
      return data.reduce((sum, item) => sum + (item[field] || 0), 0) / data.length;
    case 'sum':
      return data.reduce((sum, item) => sum + (item[field] || 0), 0);
    case 'count':
      return data.length;
    case 'max':
      return Math.max(...data.map(item => item[field] || -Infinity));
    case 'min':
      return Math.min(...data.map(item => item[field] || Infinity));
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
};

// Define tools with proper typing
export const tools: ToolDefinition[] = [
  {
    name: 'fetch_game_data',
    description: 'Fetches game data from the RAWG API with optional filters',
    parameters: {
      type: 'object',
      properties: {
        genres: {
          type: 'string',
          description: 'Filter by genres (comma-separated genre IDs)',
        },
        platforms: {
          type: 'string',
          description: 'Filter by platforms (comma-separated platform IDs)',
        },
        dates: {
          type: 'string',
          description: 'Filter by release date (format: YYYY-MM-DD,YYYY-MM-DD)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
        },
        page_size: {
          type: 'number',
          description: 'Number of results per page',
        },
      },
    },
  },
  {
    name: 'execute_calculation',
    description: 'Performs calculations on a dataset',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['average', 'sum', 'count', 'max', 'min'],
          description: 'The calculation to perform',
        },
        field: {
          type: 'string',
          description: 'The field to perform the calculation on',
        },
        data: {
          type: 'array',
          description: 'The dataset to perform calculations on',
        },
      },
      required: ['operation', 'field', 'data'],
    },
  },
];

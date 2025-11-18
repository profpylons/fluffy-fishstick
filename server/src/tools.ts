import { z } from 'zod';

export const fetchGameDataTool = {
  name: 'fetch_game_data',
  description: 'Fetches game data from the RAWG API based on filters',
  parameters: {
    type: 'object',
    properties: {
      genres: {
        type: 'string',
        description: 'Comma-separated list of genre IDs to filter by',
      },
      platforms: {
        type: 'string',
        description: 'Comma-separated list of platform IDs to filter by',
      },
      dates: {
        type: 'string',
        description: 'Filter by release date, e.g., "2020-01-01,2020-12-31"',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination',
        default: 1,
      },
      pageSize: {
        type: 'number',
        description: 'Number of results per page',
        default: 20,
      },
    },
    required: [],
  },
} as const;

export const executeCalculationTool = {
  name: 'execute_calculation',
  description: 'Performs calculations on an array of numbers',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['sum', 'average', 'max', 'min', 'count'],
        description: 'The calculation to perform',
      },
      values: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numbers to perform the calculation on',
      },
      property: {
        type: 'string',
        description: 'Optional property name for reference',
      },
    },
    required: ['operation', 'values'],
  },
} as const;

// Zod schemas for request validation
export const GameDataRequestSchema = z.object({
  genres: z.string().optional(),
  platforms: z.string().optional(),
  dates: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(40).default(20),
});

export const CalculationRequestSchema = z.object({
  operation: z.enum(['sum', 'average', 'max', 'min', 'count']),
  values: z.array(z.number()),
  property: z.string().optional(),
});

// Type exports
export type GameDataRequest = z.infer<typeof GameDataRequestSchema>;
export type CalculationRequest = z.infer<typeof CalculationRequestSchema>;

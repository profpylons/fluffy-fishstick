import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
  RAWG_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Schema for game data request
const GameDataSchema = z.object({
  genres: z.string().optional(),
  platforms: z.string().optional(),
  dates: z.string().optional(),
  page: z.number().default(1),
  page_size: z.number().max(40).default(20),
});

// Schema for calculation request
const CalculationSchema = z.object({
  operation: z.enum(['sum', 'average', 'max', 'min', 'count']),
  values: z.array(z.number()),
  property: z.string().optional(),
});

// Fetch game data from RAWG API
app.get('/api/games', zValidator('query', GameDataSchema), async (c) => {
  const query = c.req.valid('query');
  const { RAWG_API_KEY } = c.env;

  const params = new URLSearchParams();
  if (query.genres) params.append('genres', query.genres);
  if (query.platforms) params.append('platforms', query.platforms);
  if (query.dates) params.append('dates', query.dates);
  params.append('key', RAWG_API_KEY);
  params.append('page', query.page.toString());
  params.append('page_size', query.page_size.toString());

  try {
    const response = await fetch(`https://api.rawg.io/api/games?${params.toString()}`);
    const data = await response.json();
    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching game data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch game data',
    }, 500);
  }
});

// Execute calculations on the server
app.post('/api/calculate', zValidator('json', CalculationSchema), (c) => {
  const { operation, values, property } = c.req.valid('json');

  try {
    let result: number;
    const numValues: number[] = values; // Explicitly type the values array

    switch (operation) {
      case 'sum':
        result = numValues.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        result = numValues.reduce((a, b) => a + b, 0) / numValues.length;
        break;
      case 'max':
        result = Math.max(...numValues);
        break;
      case 'min':
        result = Math.min(...numValues);
        break;
      case 'count':
        result = numValues.length;
        break;
      default:
        throw new Error('Invalid operation');
    }

    return c.json({
      success: true,
      result,
      operation,
      property,
      count: numValues.length,
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return c.json({
      success: false,
      error: 'Failed to perform calculation',
    }, 400);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;

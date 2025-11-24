import { z } from 'zod';

// MCP Tool definition for RAWG rating average calculation
export const calculateRatingAverageTool = {
  name: 'calculate_rating_average',
  description: 'Calculate weighted average rating from RAWG API rating data. Takes an array of rating objects (each with id, title, count, percent) and computes the weighted average based on counts. Rating IDs: 5=exceptional, 4=recommended, 3=meh, 1=skip.',
  parameters: {
    type: 'object',
    properties: {
      ratings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Rating ID (5=exceptional, 4=recommended, 3=meh, 1=skip)',
            },
            title: {
              type: 'string',
              description: 'Rating title (exceptional, recommended, meh, skip)',
            },
            count: {
              type: 'number',
              description: 'Number of ratings at this level',
            },
            percent: {
              type: 'number',
              description: 'Percentage of total ratings',
            },
          },
          required: ['id', 'count'],
        },
        description: 'Array of rating objects from RAWG API',
      },
    },
    required: ['ratings'],
  },
};

// Zod schema for the tool
export const calculateRatingAverageZodSchema = {
  ratings: z.array(
    z.object({
      id: z.number().describe('Rating ID (5=exceptional, 4=recommended, 3=meh, 1=skip)'),
      title: z.string().optional().describe('Rating title'),
      count: z.number().describe('Number of ratings at this level'),
      percent: z.number().optional().describe('Percentage of total ratings'),
    })
  ).describe('Array of rating objects from RAWG API'),
};

/**
 * Calculate weighted average rating from RAWG rating data
 *
 * @param ratings - Array of rating objects with id and count
 * @returns Weighted average rating and breakdown
 */
export async function executeCalculateRatingAverage(args: any) {
  const { ratings } = args;

  if (!Array.isArray(ratings)) {
    throw new Error('ratings must be an array');
  }

  if (ratings.length === 0) {
    throw new Error('ratings array cannot be empty');
  }

  // Validate rating objects
  for (const rating of ratings) {
    if (typeof rating.id !== 'number' || typeof rating.count !== 'number') {
      throw new Error('Each rating must have numeric id and count properties');
    }
    if (rating.count < 0) {
      throw new Error('Rating count cannot be negative');
    }
  }

  // Calculate weighted average
  let totalWeightedScore = 0;
  let totalCount = 0;

  const breakdown = ratings.map((rating) => {
    const weightedScore = rating.id * rating.count;
    totalWeightedScore += weightedScore;
    totalCount += rating.count;

    return {
      id: rating.id,
      title: rating.title || 'unknown',
      count: rating.count,
      percent: rating.percent || 0,
      weightedScore,
    };
  });

  if (totalCount === 0) {
    throw new Error('Total rating count is zero, cannot calculate average');
  }

  const weightedAverage = totalWeightedScore / totalCount;

  return {
    weightedAverage: Number(weightedAverage.toFixed(2)),
    totalRatings: totalCount,
    breakdown,
    formula: `(${breakdown.map(r => `${r.id}×${r.count}`).join(' + ')}) / ${totalCount} = ${weightedAverage.toFixed(2)}`,
  };
}

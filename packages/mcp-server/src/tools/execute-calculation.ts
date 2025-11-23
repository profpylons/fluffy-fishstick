import { z } from 'zod';

// MCP Tool definition for calculation operations
export const executeCalculationTool = {
  name: 'execute_calculation',
  description: 'Perform statistical calculations on arrays of numbers. Calculate sum, average (mean), and standard deviation.',
  parameters: {
    type: 'object',
    properties: {
      numbers: {
        type: 'array',
        items: {
          type: 'number',
        },
        description: 'Array of numbers to perform calculations on',
      },
      operations: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['sum', 'average', 'std_dev'],
        },
        description: 'Operations to perform: sum, average, std_dev (standard deviation). If not specified, all operations will be performed.',
      },
    },
    required: ['numbers'],
  },
};

// Zod schema for the tool
export const executeCalculationZodSchema = {
  numbers: z.array(z.number()).describe('Array of numbers to perform calculations on'),
  operations: z.array(z.enum(['sum', 'average', 'std_dev']))
    .optional()
    .describe('Operations to perform: sum, average, std_dev (standard deviation). If not specified, all operations will be performed.'),
};

// Calculation functions
function calculateSum(numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  return calculateSum(numbers) / numbers.length;
}

function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const avg = calculateAverage(numbers);
  const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
  const variance = calculateSum(squaredDiffs) / numbers.length;
  return Math.sqrt(variance);
}

// Function to execute the tool
export async function executeCalculation(args: any) {
  const { numbers, operations } = args;

  if (!Array.isArray(numbers)) {
    throw new Error('numbers must be an array');
  }

  // Validate all elements are numbers
  if (!numbers.every(n => typeof n === 'number' && !isNaN(n))) {
    throw new Error('All elements in numbers array must be valid numbers');
  }

  // Default to all operations if not specified
  const opsToPerform = operations || ['sum', 'average', 'std_dev'];

  const results: Record<string, number> = {};

  try {
    for (const op of opsToPerform) {
      switch (op) {
        case 'sum':
          results.sum = calculateSum(numbers);
          break;
        case 'average':
          results.average = calculateAverage(numbers);
          break;
        case 'std_dev':
          results.std_dev = calculateStandardDeviation(numbers);
          break;
        default:
          throw new Error(`Unknown operation: ${op}`);
      }
    }

    return {
      input: {
        numbers,
        count: numbers.length,
      },
      results,
    };
  } catch (error: any) {
    throw new Error(`Error executing calculation: ${error.message}`);
  }
}

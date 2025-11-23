import { describe, it, expect } from '@jest/globals';
import { executeCalculation, executeCalculationTool, executeCalculationZodSchema } from '../execute-calculation.js';

describe('executeCalculationTool', () => {
  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(executeCalculationTool.name).toBe('execute_calculation');
    });

    it('should have description', () => {
      expect(executeCalculationTool.description).toBeTruthy();
      expect(typeof executeCalculationTool.description).toBe('string');
    });

    it('should have valid parameters schema', () => {
      expect(executeCalculationTool.parameters).toBeDefined();
      expect(executeCalculationTool.parameters.type).toBe('object');
      expect(executeCalculationTool.parameters.properties.numbers).toBeDefined();
      expect(executeCalculationTool.parameters.properties.operations).toBeDefined();
      expect(executeCalculationTool.parameters.required).toContain('numbers');
    });
  });

  describe('executeCalculation', () => {
    describe('sum operation', () => {
      it('should calculate sum of positive numbers', async () => {
        const result = await executeCalculation({
          numbers: [1, 2, 3, 4, 5],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(15);
        expect(result.input.count).toBe(5);
      });

      it('should calculate sum of negative numbers', async () => {
        const result = await executeCalculation({
          numbers: [-1, -2, -3],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(-6);
      });

      it('should calculate sum of mixed positive and negative numbers', async () => {
        const result = await executeCalculation({
          numbers: [10, -5, 3, -2],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(6);
      });

      it('should return 0 for empty array', async () => {
        const result = await executeCalculation({
          numbers: [],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(0);
      });

      it('should handle single number', async () => {
        const result = await executeCalculation({
          numbers: [42],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(42);
      });

      it('should handle decimal numbers', async () => {
        const result = await executeCalculation({
          numbers: [1.5, 2.5, 3.0],
          operations: ['sum']
        });

        expect(result.results.sum).toBe(7);
      });
    });

    describe('average operation', () => {
      it('should calculate average of numbers', async () => {
        const result = await executeCalculation({
          numbers: [10, 20, 30, 40],
          operations: ['average']
        });

        expect(result.results.average).toBe(25);
      });

      it('should calculate average of single number', async () => {
        const result = await executeCalculation({
          numbers: [42],
          operations: ['average']
        });

        expect(result.results.average).toBe(42);
      });

      it('should return 0 for empty array', async () => {
        const result = await executeCalculation({
          numbers: [],
          operations: ['average']
        });

        expect(result.results.average).toBe(0);
      });

      it('should handle decimal averages', async () => {
        const result = await executeCalculation({
          numbers: [1, 2, 3],
          operations: ['average']
        });

        expect(result.results.average).toBe(2);
      });

      it('should handle negative numbers', async () => {
        const result = await executeCalculation({
          numbers: [-10, -20, -30],
          operations: ['average']
        });

        expect(result.results.average).toBe(-20);
      });
    });

    describe('standard deviation operation', () => {
      it('should calculate standard deviation', async () => {
        const result = await executeCalculation({
          numbers: [2, 4, 4, 4, 5, 5, 7, 9],
          operations: ['std_dev']
        });

        expect(result.results.std_dev).toBeCloseTo(2, 1);
      });

      it('should return 0 for single number', async () => {
        const result = await executeCalculation({
          numbers: [5],
          operations: ['std_dev']
        });

        expect(result.results.std_dev).toBe(0);
      });

      it('should return 0 for empty array', async () => {
        const result = await executeCalculation({
          numbers: [],
          operations: ['std_dev']
        });

        expect(result.results.std_dev).toBe(0);
      });

      it('should return 0 for identical numbers', async () => {
        const result = await executeCalculation({
          numbers: [5, 5, 5, 5],
          operations: ['std_dev']
        });

        expect(result.results.std_dev).toBe(0);
      });

      it('should handle negative numbers', async () => {
        const result = await executeCalculation({
          numbers: [-2, -4, -6],
          operations: ['std_dev']
        });

        expect(result.results.std_dev).toBeGreaterThan(0);
      });
    });

    describe('multiple operations', () => {
      it('should perform all operations when not specified', async () => {
        const result = await executeCalculation({
          numbers: [10, 20, 30]
        });

        expect(result.results.sum).toBe(60);
        expect(result.results.average).toBe(20);
        expect(result.results.std_dev).toBeGreaterThan(0);
      });

      it('should perform multiple specified operations', async () => {
        const result = await executeCalculation({
          numbers: [5, 10, 15],
          operations: ['sum', 'average']
        });

        expect(result.results.sum).toBe(30);
        expect(result.results.average).toBe(10);
        expect(result.results.std_dev).toBeUndefined();
      });

      it('should include input metadata', async () => {
        const numbers = [1, 2, 3, 4, 5];
        const result = await executeCalculation({
          numbers,
          operations: ['sum']
        });

        expect(result.input.numbers).toEqual(numbers);
        expect(result.input.count).toBe(5);
      });
    });

    describe('error handling', () => {
      it('should throw error for non-array input', async () => {
        await expect(executeCalculation({
          numbers: 'not an array',
          operations: ['sum']
        })).rejects.toThrow('numbers must be an array');
      });

      it('should throw error for array with non-numeric values', async () => {
        await expect(executeCalculation({
          numbers: [1, 2, 'three', 4],
          operations: ['sum']
        })).rejects.toThrow('All elements in numbers array must be valid numbers');
      });

      it('should throw error for array with NaN', async () => {
        await expect(executeCalculation({
          numbers: [1, 2, NaN, 4],
          operations: ['sum']
        })).rejects.toThrow('All elements in numbers array must be valid numbers');
      });

      it('should throw error for unknown operation', async () => {
        await expect(executeCalculation({
          numbers: [1, 2, 3],
          operations: ['invalid_operation']
        })).rejects.toThrow();
      });

      it('should throw error for null input', async () => {
        await expect(executeCalculation({
          numbers: null,
          operations: ['sum']
        })).rejects.toThrow('numbers must be an array');
      });

      it('should throw error for undefined input', async () => {
        await expect(executeCalculation({
          numbers: undefined,
          operations: ['sum']
        })).rejects.toThrow('numbers must be an array');
      });
    });

    describe('edge cases', () => {
      it('should handle very large numbers', async () => {
        const result = await executeCalculation({
          numbers: [1e10, 2e10, 3e10],
          operations: ['sum', 'average']
        });

        expect(result.results.sum).toBe(6e10);
        expect(result.results.average).toBe(2e10);
      });

      it('should handle very small numbers', async () => {
        const result = await executeCalculation({
          numbers: [0.0001, 0.0002, 0.0003],
          operations: ['sum']
        });

        expect(result.results.sum).toBeCloseTo(0.0006, 4);
      });

      it('should handle zero values', async () => {
        const result = await executeCalculation({
          numbers: [0, 0, 0],
          operations: ['sum', 'average', 'std_dev']
        });

        expect(result.results.sum).toBe(0);
        expect(result.results.average).toBe(0);
        expect(result.results.std_dev).toBe(0);
      });

      it('should handle mix of zero and non-zero values', async () => {
        const result = await executeCalculation({
          numbers: [0, 5, 0, 10],
          operations: ['sum', 'average']
        });

        expect(result.results.sum).toBe(15);
        expect(result.results.average).toBe(3.75);
      });
    });
  });

  describe('zod schema', () => {
    it('should have numbers field', () => {
      expect(executeCalculationZodSchema.numbers).toBeDefined();
    });

    it('should have operations field', () => {
      expect(executeCalculationZodSchema.operations).toBeDefined();
    });
  });
});

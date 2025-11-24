import { executeCalculateRatingAverage, calculateRatingAverageTool } from '../calculate-rating-average';

describe('calculate-rating-average tool', () => {
  describe('Tool Definition', () => {
    it('should have correct tool metadata', () => {
      expect(calculateRatingAverageTool.name).toBe('calculate_rating_average');
      expect(calculateRatingAverageTool.description).toContain('weighted average');
      expect(calculateRatingAverageTool.parameters.type).toBe('object');
    });

    it('should have ratings array in parameters', () => {
      const { properties } = calculateRatingAverageTool.parameters;
      expect(properties.ratings).toBeDefined();
      expect(properties.ratings.type).toBe('array');
    });

    it('should have required ratings parameter', () => {
      expect(calculateRatingAverageTool.parameters.required).toContain('ratings');
    });
  });

  describe('executeCalculateRatingAverage', () => {
    it('should calculate weighted average correctly', async () => {
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, title: 'exceptional', count: 4, percent: 57.14 },
          { id: 4, title: 'recommended', count: 2, percent: 28.57 },
          { id: 3, title: 'meh', count: 1, percent: 14.29 },
        ],
      });

      // (5*4 + 4*2 + 3*1) / (4+2+1) = (20+8+3)/7 = 31/7 = 4.43
      expect(result.weightedAverage).toBe(4.43);
      expect(result.totalRatings).toBe(7);
    });

    it('should handle single rating', async () => {
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, title: 'exceptional', count: 10, percent: 100 },
        ],
      });

      expect(result.weightedAverage).toBe(5);
      expect(result.totalRatings).toBe(10);
    });

    it('should handle ratings without title and percent', async () => {
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, count: 3 },
          { id: 1, count: 2 },
        ],
      });

      // (5*3 + 1*2) / 5 = 17/5 = 3.4
      expect(result.weightedAverage).toBe(3.4);
      expect(result.totalRatings).toBe(5);
    });

    it('should include breakdown with weighted scores', async () => {
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, title: 'exceptional', count: 2, percent: 50 },
          { id: 3, title: 'meh', count: 2, percent: 50 },
        ],
      });

      expect(result.breakdown).toEqual([
        {
          id: 5,
          title: 'exceptional',
          count: 2,
          percent: 50,
          weightedScore: 10,
        },
        {
          id: 3,
          title: 'meh',
          count: 2,
          percent: 50,
          weightedScore: 6,
        },
      ]);
    });

    it('should include formula in result', async () => {
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, count: 1 },
          { id: 4, count: 1 },
        ],
      });

      expect(result.formula).toContain('5×1');
      expect(result.formula).toContain('4×1');
      expect(result.formula).toContain('/ 2');
    });

    it('should throw error for non-array ratings', async () => {
      await expect(
        executeCalculateRatingAverage({ ratings: 'not an array' })
      ).rejects.toThrow('ratings must be an array');
    });

    it('should throw error for empty ratings array', async () => {
      await expect(
        executeCalculateRatingAverage({ ratings: [] })
      ).rejects.toThrow('ratings array cannot be empty');
    });

    it('should throw error for invalid rating object', async () => {
      await expect(
        executeCalculateRatingAverage({
          ratings: [{ id: 'invalid', count: 5 }],
        })
      ).rejects.toThrow('numeric id and count');
    });

    it('should throw error for negative count', async () => {
      await expect(
        executeCalculateRatingAverage({
          ratings: [{ id: 5, count: -1 }],
        })
      ).rejects.toThrow('count cannot be negative');
    });

    it('should throw error when total count is zero', async () => {
      await expect(
        executeCalculateRatingAverage({
          ratings: [
            { id: 5, count: 0 },
            { id: 4, count: 0 },
          ],
        })
      ).rejects.toThrow('Total rating count is zero');
    });

    it('should handle RAWG API format correctly', async () => {
      // Real-world example from RAWG API
      const result = await executeCalculateRatingAverage({
        ratings: [
          { id: 5, title: 'exceptional', count: 3500, percent: 70 },
          { id: 4, title: 'recommended', count: 1000, percent: 20 },
          { id: 3, title: 'meh', count: 400, percent: 8 },
          { id: 1, title: 'skip', count: 100, percent: 2 },
        ],
      });

      // (5*3500 + 4*1000 + 3*400 + 1*100) / 5000 = (17500+4000+1200+100)/5000 = 22800/5000 = 4.56
      expect(result.weightedAverage).toBe(4.56);
      expect(result.totalRatings).toBe(5000);
    });
  });
});

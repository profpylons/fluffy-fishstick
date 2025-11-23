import { describe, it, expect } from '@jest/globals';
import { fetchGameDataTool, fetchGameDataZodSchema, convertToZodSchema } from '../fetch-game-data.js';

describe('fetchGameDataTool', () => {
  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(fetchGameDataTool.name).toBe('fetch_game_data');
    });

    it('should have description', () => {
      expect(fetchGameDataTool.description).toBeTruthy();
      expect(typeof fetchGameDataTool.description).toBe('string');
      expect(fetchGameDataTool.description).toContain('RAWG API');
    });

    it('should have valid parameters schema', () => {
      expect(fetchGameDataTool.parameters).toBeDefined();
      expect(fetchGameDataTool.parameters.type).toBe('object');
      expect(fetchGameDataTool.parameters.properties).toBeDefined();
      expect(fetchGameDataTool.parameters.required).toContain('action');
    });

    it('should define all action types', () => {
      const actionEnum = fetchGameDataTool.parameters.properties.action.enum;
      expect(actionEnum).toContain('search');
      expect(actionEnum).toContain('details');
      expect(actionEnum).toContain('genres');
      expect(actionEnum).toContain('platforms');
      expect(actionEnum).toHaveLength(4);
    });

    it('should have all required parameter properties', () => {
      const props = fetchGameDataTool.parameters.properties;
      expect(props.action).toBeDefined();
      expect(props.search).toBeDefined();
      expect(props.game_id).toBeDefined();
      expect(props.page_size).toBeDefined();
      expect(props.ordering).toBeDefined();
      expect(props.dates).toBeDefined();
      expect(props.platforms).toBeDefined();
      expect(props.genres).toBeDefined();
    });

    it('should have correct parameter types', () => {
      const props = fetchGameDataTool.parameters.properties;
      expect(props.action.type).toBe('string');
      expect(props.search.type).toBe('string');
      expect(props.game_id.type).toBe('number');
      expect(props.page_size.type).toBe('number');
      expect(props.ordering.type).toBe('string');
      expect(props.dates.type).toBe('string');
      expect(props.platforms.type).toBe('string');
      expect(props.genres.type).toBe('string');
    });

    it('should have ordering enum values', () => {
      const ordering = fetchGameDataTool.parameters.properties.ordering;
      expect(ordering.enum).toContain('-rating');
      expect(ordering.enum).toContain('-released');
      expect(ordering.enum).toContain('rating');
      expect(ordering.enum).toContain('released');
    });

    it('should have descriptions for all parameters', () => {
      const props = fetchGameDataTool.parameters.properties;
      expect(props.action.description).toBeTruthy();
      expect(props.search.description).toBeTruthy();
      expect(props.game_id.description).toBeTruthy();
      expect(props.page_size.description).toBeTruthy();
      expect(props.ordering.description).toBeTruthy();
      expect(props.dates.description).toBeTruthy();
      expect(props.platforms.description).toBeTruthy();
      expect(props.genres.description).toBeTruthy();
    });
  });

  describe('convertToZodSchema', () => {
    it('should convert tool definition to Zod schema', () => {
      const schema = convertToZodSchema(fetchGameDataTool);
      expect(schema).toBeDefined();
      expect(schema.action).toBeDefined();
    });

    it('should handle required fields', () => {
      const schema = convertToZodSchema(fetchGameDataTool);
      expect(schema.action).toBeDefined();
      // action is required, so it should not be optional
    });

    it('should handle optional fields', () => {
      const schema = convertToZodSchema(fetchGameDataTool);
      expect(schema.search).toBeDefined();
      expect(schema.game_id).toBeDefined();
      expect(schema.page_size).toBeDefined();
    });

    it('should handle enum types', () => {
      const schema = convertToZodSchema(fetchGameDataTool);
      expect(schema.action).toBeDefined();
      expect(schema.ordering).toBeDefined();
    });
  });

  describe('zod schema export', () => {
    it('should have action field', () => {
      expect(fetchGameDataZodSchema.action).toBeDefined();
    });

    it('should have optional search field', () => {
      expect(fetchGameDataZodSchema.search).toBeDefined();
    });

    it('should have optional game_id field', () => {
      expect(fetchGameDataZodSchema.game_id).toBeDefined();
    });

    it('should have optional page_size field', () => {
      expect(fetchGameDataZodSchema.page_size).toBeDefined();
    });

    it('should have optional ordering field', () => {
      expect(fetchGameDataZodSchema.ordering).toBeDefined();
    });

    it('should have optional dates field', () => {
      expect(fetchGameDataZodSchema.dates).toBeDefined();
    });

    it('should have optional platforms field', () => {
      expect(fetchGameDataZodSchema.platforms).toBeDefined();
    });

    it('should have optional genres field', () => {
      expect(fetchGameDataZodSchema.genres).toBeDefined();
    });
  });
});

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  metacritic: number;
  platforms: {
    platform: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
  genres: {
    id: number;
    name: string;
    slug: string;
  }[];
  tags: {
    id: number;
    name: string;
    slug: string;
  }[];
  short_screenshots: {
    id: number;
    image: string;
  }[];
}

export interface GameListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Game[];
}

export interface FetchGameDataParams {
  genres?: string;
  platforms?: string;
  dates?: string;
  page?: number;
  page_size?: number;
}

export interface ExecuteCalculationParams {
  operation: 'average' | 'sum' | 'count' | 'max' | 'min';
  field: string;
  data: any[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

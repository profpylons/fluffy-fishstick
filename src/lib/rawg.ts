import axios from 'axios';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface GameSearchParams {
  search?: string;
  page_size?: number;
  ordering?: string;
  dates?: string;
  platforms?: string;
  genres?: string;
}

export async function searchGames(params: GameSearchParams) {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}

export async function getGameDetails(id: number) {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/games/${id}`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
}

export async function getGenres() {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/genres`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
}

export async function getPlatforms() {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/platforms`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching platforms:', error);
    throw error;
  }
}

import axios from 'axios';
const RAWG_BASE_URL = 'https://api.rawg.io/api';
// Global API key - can be set by Workers or defaults to process.env
let globalApiKey;
// Set API key (called by Workers with env.RAWG_API_KEY)
export function setApiKey(key) {
    globalApiKey = key;
}
// Get API key from environment - supports both Node.js and Cloudflare Workers
function getApiKey() {
    // Use globally set key (from Workers)
    if (globalApiKey) {
        return globalApiKey;
    }
    // Fall back to process.env for Node.js
    if (typeof process !== 'undefined' && process.env?.RAWG_API_KEY) {
        return process.env.RAWG_API_KEY;
    }
    throw new Error('RAWG_API_KEY not configured. Set via setApiKey() or process.env.RAWG_API_KEY');
}
export async function searchGames(params) {
    try {
        const response = await axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
                key: getApiKey(),
                ...params,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching games:', error);
        throw error;
    }
}
export async function getGameDetails(id) {
    try {
        const response = await axios.get(`${RAWG_BASE_URL}/games/${id}`, {
            params: {
                key: getApiKey(),
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching game details:', error);
        throw error;
    }
}
export async function getGenres() {
    try {
        const response = await axios.get(`${RAWG_BASE_URL}/genres`, {
            params: {
                key: getApiKey(),
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching genres:', error);
        throw error;
    }
}
export async function getPlatforms() {
    try {
        const response = await axios.get(`${RAWG_BASE_URL}/platforms`, {
            params: {
                key: getApiKey(),
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching platforms:', error);
        throw error;
    }
}
//# sourceMappingURL=rawg.js.map
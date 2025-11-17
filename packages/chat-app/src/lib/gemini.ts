import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchGameDataTool, executeFetchGameData } from './mcp/mcp-tools';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
) {
  // Configure model with function calling
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [
      {
        functionDeclarations: [
          {
            name: fetchGameDataTool.name,
            description: fetchGameDataTool.description,
            parameters: fetchGameDataTool.parameters as any,
          },
        ],
      },
    ],
  });

  const systemInstruction = {
    parts: [
      {
        text: `You are a helpful AI assistant specializing in video game data analytics. You have access to the RAWG game database through the fetch_game_data tool.

When users ask about games, use the fetch_game_data tool to:
- Search for games by name
- Get detailed information about specific games
- Filter games by year, platform, or genre
- Sort games by rating or release date
- List available genres and platforms

Be conversational, helpful, and provide clear, data-driven insights based on the data you retrieve.`,
      },
    ],
    role: 'user',
  };

  // Build conversation history for Gemini
  // Filter out any leading assistant messages (like initial greeting)
  let filteredHistory = conversationHistory;
  while (filteredHistory.length > 0 && filteredHistory[0].role === 'assistant') {
    filteredHistory = filteredHistory.slice(1);
  }

  const history = filteredHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  try {
    // Start chat with history
    const chat = model.startChat({
      history,
      systemInstruction,
    });

    // Send the user message
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Handle function calls
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0];

      console.log('Function call:', functionCall.name, functionCall.args);

      if (functionCall.name === 'fetch_game_data') {
        try {
          // Execute the tool
          const toolResult = await executeFetchGameData(functionCall.args);

          console.log('Tool result:', JSON.stringify(toolResult).substring(0, 200) + '...');

          // Send the function response back to the model
          result = await chat.sendMessage([
            {
              functionResponse: {
                name: functionCall.name,
                response: {
                  content: toolResult,
                },
              },
            },
          ]);

          response = result.response;
        } catch (error: any) {
          console.error('Error executing tool:', error);

          // Send error back to model
          result = await chat.sendMessage([
            {
              functionResponse: {
                name: functionCall.name,
                response: {
                  error: error.message,
                },
              },
            },
          ]);

          response = result.response;
        }
      }
    }

    return response.text();
  } catch (error: any) {
    // Parse and provide friendly error messages
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.error('❌ Gemini API Quota Exceeded');
      console.error('💡 You have exceeded your Gemini API quota.');
      console.error('📝 Solutions:');
      console.error('   1. Wait a few minutes and try again');
      console.error('   2. Check your quota at: https://aistudio.google.com/app/apikey');
      console.error('   3. Upgrade your API plan if needed');
      throw new Error('API quota exceeded. Please wait a few minutes and try again, or check your quota at https://aistudio.google.com/app/apikey');
    }

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid API key')) {
      console.error('❌ Invalid Gemini API Key');
      console.error('💡 Your Gemini API key is invalid or not set.');
      console.error('📝 Solution: Check your GEMINI_API_KEY in .env.local');
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY in .env.local');
    }

    if (errorMessage.includes('model not found') || errorMessage.includes('not found for API version')) {
      console.error('❌ Gemini Model Not Available');
      console.error('💡 The gemini-2.0-flash-exp model may not be available in your region or has been deprecated.');
      console.error('📝 Solution: Try using "gemini-1.5-flash" or "gemini-1.5-pro" instead');
      throw new Error('Model not available. Try using a different model like gemini-1.5-flash');
    }

    // Generic error
    console.error('❌ Gemini API Error:', errorMessage);
    console.error('Full error:', error);
    throw error;
  }
}

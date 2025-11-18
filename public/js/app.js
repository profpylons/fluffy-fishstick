// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const responseTimeElement = document.getElementById('response-time');
const lastUpdatedElement = document.getElementById('last-updated');

// MCP Server URL - update this to your deployed URL
const MCP_SERVER_URL = 'http://localhost:8787/api';

// Add a message to the chat
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<p>${content}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading indicator
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
        <div class="loading">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Update metrics
function updateMetrics(responseTime) {
    if (responseTime) {
        responseTimeElement.textContent = `${responseTime}ms`;
    }
    lastUpdatedElement.textContent = new Date().toLocaleTimeString();
}

// Handle user input
async function handleUserInput() {
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message to chat
    addMessage('user', question);
    userInput.value = '';
    sendButton.disabled = true;
    
    // Show loading indicator
    showLoading();

    try {
        const startTime = performance.now();
        
        // Call the MCP server
        const response = await fetch(`${MCP_SERVER_URL}/.well-known/mcp/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tool: 'fetch_game_data',
                parameters: {
                    // Add any necessary parameters based on the question
                    // This is a simplified example
                    dates: '2023-01-01,2023-12-31',
                    page_size: 10
                }
            })
        });

        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Hide loading indicator
        hideLoading();
        
        // Add assistant's response to chat
        addMessage('assistant', formatResponse(data.result));
        
        // Update metrics
        updateMetrics(responseTime);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
    } finally {
        sendButton.disabled = false;
    }
}

// Format the API response for display
function formatResponse(data) {
    if (!data || !data.results || !Array.isArray(data.results)) {
        return 'No game data available.';
    }

    const games = data.results;
    
    if (games.length === 0) {
        return 'No games found matching your criteria.';
    }

    // Create a simple summary of the games
    const gameList = games.map(game => 
        `• ${game.name} (${game.released}) - Rating: ${game.metacritic || 'N/A'}`
    ).join('<br>');
    
    return `Here are some games I found:<br>${gameList}`;
}

// Event listeners
sendButton.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Initialize
updateMetrics();

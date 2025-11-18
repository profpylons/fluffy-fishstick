import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { mcpServer } from './mcp/server';

// Create a new Hono app
const app = new Hono();

// Mount the MCP server
app.route('/api', mcpServer);

// Serve the frontend from the public directory
app.get('*', async (c) => {
  return c.redirect('https://your-frontend-url.com');
});

// Handle 404
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Export the handler for Cloudflare Pages
export const onRequest = handle(app);

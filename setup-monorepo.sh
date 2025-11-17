#!/bin/bash

echo "🚀 Setting up Game Data Chat Monorepo..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build MCP server
echo ""
echo "🔨 Building MCP server..."
npm run build --workspace=mcp-server

# Check for env files
echo ""
echo "🔍 Checking environment variables..."

if [ ! -f "packages/chat-app/.env.local" ]; then
  echo "⚠️  Missing: packages/chat-app/.env.local"
  echo "   Copy from: packages/chat-app/env.example"
  echo "   Add your ANTHROPIC_API_KEY"
else
  echo "✅ Found: packages/chat-app/.env.local"
fi

if [ ! -f "packages/mcp-server/.env.local" ]; then
  echo "⚠️  Missing: packages/mcp-server/.env.local"
  echo "   Copy from: packages/mcp-server/env.example"
  echo "   Add your RAWG_API_KEY"
else
  echo "✅ Found: packages/mcp-server/.env.local"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure environment variables (see above)"
echo "  2. Run: npm run dev"
echo "  3. Visit: http://localhost:3000"
echo ""
echo "Commands:"
echo "  npm run dev       - Run chat app"
echo "  npm run dev:mcp   - Run MCP server"
echo "  npm run dev:all   - Run both"
echo ""

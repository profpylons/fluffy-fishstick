# Deploying Chat App to Cloudflare Pages

This guide covers deploying the Next.js chat application to Cloudflare Pages.

## Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- ANTHROPIC_API_KEY from https://console.anthropic.com/
- MCP Server deployed (see `packages/mcp-server/README.md`)

## Deployment Steps

### 1. Connect Repository to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Connect to your Git repository
4. Select the repository: `game-data-chat`

### 2. Configure Build Settings

In the Cloudflare Pages setup:

**Framework preset**: `Next.js`

**Build command**:
```bash
cd packages/chat-app && npm install && npm run build
```

**Build output directory**:
```
packages/chat-app/.next
```

**Root directory**: `/` (keep at repository root)

**Node version**: `20` or later

### 3. Set Environment Variables (CRITICAL - Use Secrets!)

**⚠️ IMPORTANT: Use encrypted environment variables for all sensitive data!**

Cloudflare Pages encrypts environment variables by default, but you should treat them as secrets.

#### Using Wrangler CLI (Recommended)

```bash
# Navigate to chat-app directory
cd packages/chat-app

# Set secrets via Wrangler CLI
wrangler pages secret put ANTHROPIC_API_KEY --project-name=your-project-name
# When prompted, paste your API key

wrangler pages secret put MCP_SERVER_URL --project-name=your-project-name
# When prompted, paste your MCP server URL
```

#### Using Cloudflare Dashboard (Alternative)

In Cloudflare Pages → Settings → Environment variables, add:

**Production Environment**

| Variable Name | Value | Example |
|--------------|-------|---------|------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (encrypted) | `sk-ant-api03-...` |
| `MCP_SERVER_URL` | Your deployed MCP server URL | `https://your-mcp-server.workers.dev` |

**Preview Environment** (optional)

Same variables as production, or use test/development values:

```bash
# For preview deployments
wrangler pages secret put ANTHROPIC_API_KEY --project-name=your-project-name --env=preview
wrangler pages secret put MCP_SERVER_URL --project-name=your-project-name --env=preview
```

### 4. Deploy

1. **First deployment**: Click **Save and Deploy**
2. **Subsequent deployments**: Push to your repository's main branch

Cloudflare Pages will automatically:
- Build your Next.js app
- Deploy to a Cloudflare edge network
- Provide a `*.pages.dev` URL

### 5. Custom Domain (Optional)

1. In Cloudflare Pages → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `chat.yourdomain.com`)
4. Cloudflare will automatically configure DNS

## Verifying Deployment

1. Visit your `*.pages.dev` URL
2. Check that the chat interface loads
3. Try asking a question about games
4. Verify tool calls in debug mode: `https://your-app.pages.dev?debug`

## Environment Variable Management

### Updating Variables

1. Go to Cloudflare Pages → Settings → Environment variables
2. Edit variables
3. **Important**: You must trigger a new deployment for changes to take effect
   - Option A: Push a commit to your repository
   - Option B: Use **Redeploy** button in Cloudflare Pages dashboard

### Local Development vs Production

- **Local**: Uses `packages/chat-app/.env` file
- **Production**: Uses Cloudflare Pages environment variables

Ensure both have the same variables configured:
- `ANTHROPIC_API_KEY`
- `MCP_SERVER_URL`

## Monitoring

### View Logs

1. Go to Cloudflare Pages → Your project
2. Click on a deployment
3. View **Functions** tab for API route logs

### Check Performance

1. Navigate to **Analytics** tab
2. Monitor requests, errors, and performance

## Troubleshooting

### API Routes Not Working

**Symptom**: Chat loads but doesn't respond

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set in Cloudflare Pages environment variables
2. Check MCP_SERVER_URL points to deployed MCP server
3. Review Functions logs for errors

### MCP Server Connection Errors

**Symptom**: Error message about MCP server

**Solution**:
1. Ensure MCP server is deployed and accessible
2. Test MCP server URL directly: `https://your-mcp-server.workers.dev/v1/tools`
3. Verify RAWG_API_KEY is set in MCP server secrets

### Build Failures

**Symptom**: Deployment fails during build

**Solution**:
1. Check build logs in Cloudflare Pages
2. Verify Node version is 20 or later
3. Ensure all dependencies are in `package.json`
4. Try building locally: `cd packages/chat-app && npm run build`

## Continuous Deployment

Every push to your repository's main branch triggers:
1. Automatic build
2. Deployment to Cloudflare Pages
3. Invalidation of cache

Preview deployments are created for pull requests automatically.

## Cost

Cloudflare Pages offers:
- **Free tier**: 500 builds/month, unlimited requests
- **Paid plan**: $20/month for unlimited builds

API costs (Anthropic Claude) are separate and billed by Anthropic.

## Security Best Practices

### Managing Secrets

**✅ DO:**
- Use `wrangler pages secret put` command for all API keys
- Store secrets in Cloudflare Pages encrypted environment variables
- Use different keys for preview/production environments
- Rotate keys regularly (at least quarterly)

**❌ DON'T:**
- Never commit API keys to your repository
- Never store keys in `.env` files that get committed
- Never share keys in chat, email, or documentation
- Never use production keys in local development

### Key Rotation

To rotate the Anthropic API key:

```bash
# Generate new key at https://console.anthropic.com/
# Update in Cloudflare
wrangler pages secret put ANTHROPIC_API_KEY --project-name=your-project-name
# Paste new key when prompted

# Trigger new deployment to use new key
wrangler pages deployment create --branch=main
```

### Monitoring

- Monitor usage in [Anthropic Console](https://console.anthropic.com/)
- Check Cloudflare Analytics for unusual traffic
- Set up alerts for high API usage

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Anthropic API Documentation](https://docs.anthropic.com/)

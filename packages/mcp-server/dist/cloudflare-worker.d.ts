/**
 * Cloudflare Workers wrapper for MCP Server
 *
 * This is a thin HTTP adapter that exposes the MCP tools
 * via HTTP endpoints for Cloudflare AI Gateway integration.
 *
 * Note: This bypasses the stdio-based MCP server and calls
 * tool execution directly, since Workers use HTTP not stdio.
 */
/**
 * Main Cloudflare Workers entry point
 */
declare const _default: {
    fetch(request: Request, env: any): Promise<Response>;
};
export default _default;
//# sourceMappingURL=cloudflare-worker.d.ts.map
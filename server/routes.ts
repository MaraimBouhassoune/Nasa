import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy /api requests to Python FastAPI backend running on port 8000
  // When mounted at /api, the middleware strips it, so we add it back
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: {
        '^/': '/api/', // Prepend /api to the stripped path
      },
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}

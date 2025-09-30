import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy /api requests to Python FastAPI backend running on port 8000
  // Use filter function to match /api/* and keep the full path
  app.use(
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      logLevel: "silent",
      filter: (pathname) => pathname.startsWith('/api'),
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}

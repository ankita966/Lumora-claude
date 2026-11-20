import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables (including GEMINI_API_KEY) from .env / .env.local into process.env for Node dev server
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  const apiInsightsPlugin = {
    name: 'api-insights-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/insights') {
          try {
            const { default: handler } = await import('./api/insights.js');
            await handler(req, res);
          } catch (err) {
            console.error('[API Middleware Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error in API middleware' }));
          }
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/insights') {
          try {
            const { default: handler } = await import('./api/insights.js');
            await handler(req, res);
          } catch (err) {
            console.error('[API Middleware Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error in API middleware' }));
          }
          return;
        }
        next();
      });
    },
  };

  return {
    plugins: [react(), apiInsightsPlugin],
    server: {
      host: true,
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: true,
      port: 5173,
      allowedHosts: true,
    },
  };
});

import cors from 'cors';
import express from 'express';
import { scrapeRouter } from './routes/scrapeRoutes.js';

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '64kb' }));

  app.get('/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/api', scrapeRouter);

  app.use((error, _request, response, _next) => {
    const status = error.status || 500;
    const message = status >= 500 ? 'Unexpected scraper error' : error.message;
    response.status(status).json({
      error: message,
      status,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

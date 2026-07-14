import cors from 'cors';
import express from 'express';
import { scrapeRouter } from './routes/scrapeRoutes.js';

const DEFAULT_CLIENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin) || isLocalhostOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      optionsSuccessStatus: 204
    })
  );
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

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_CLIENT_ORIGINS, ...configuredOrigins]);
}

function isLocalhostOrigin(origin) {
  try {
    const { hostname, protocol } = new URL(origin);
    return ['http:', 'https:'].includes(protocol) && ['localhost', '127.0.0.1'].includes(hostname);
  } catch {
    return false;
  }
}

import { scrapePlaces } from '../apps/server/src/controllers/scrapeController.js';
import { validateScrapeRequest } from '../apps/server/src/utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');

  let cancelled = false;
  res.on('close', () => {
    if (!res.writableEnded) cancelled = true;
  });

  let input;
  try {
    input = validateScrapeRequest(req.body);
  } catch (error) {
    return res.status(error.status || 400).json({
      error: error.message,
      status: error.status || 400,
      timestamp: new Date().toISOString()
    });
  }

  const rows = [];
  const send = (event) => {
    if (cancelled) return;
    res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    await scrapePlaces(req, res, (error) => {
      if (error) throw error;
    });
  } catch (error) {
    send({
      type: 'error',
      message: error.status ? error.message : 'Unexpected scraper error'
    });
  }
}

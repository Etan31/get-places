import { runPlaceScrape } from '../services/placeScraper.js';
import { toCsv } from '../utils/csv.js';
import { validateScrapeRequest } from '../utils/validation.js';

export async function scrapePlaces(request, response, next) {
  let input;
  try {
    input = validateScrapeRequest(request.body);
  } catch (error) {
    next(error);
    return;
  }

  let cancelled = false;
  response.on('close', () => {
    if (!response.writableEnded) cancelled = true;
  });

  response.setHeader('Content-Type', 'application/x-ndjson');
  response.setHeader('Cache-Control', 'no-cache');
  response.flushHeaders();

  const send = (event) => {
    if (cancelled) return;
    response.write(`${JSON.stringify(event)}\n`);
  };

  try {
    const rows = await runPlaceScrape(input, { onEvent: send, isCancelled: () => cancelled });
    send({ type: 'done', count: rows.length, csv: toCsv(rows) });
  } catch (error) {
    send({ type: 'error', message: error.status ? error.message : 'Unexpected scraper error' });
  } finally {
    response.end();
  }
}

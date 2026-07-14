import { runPlaceScrape } from '../services/placeScraper.js';
import { toCsv } from '../utils/csv.js';
import { validateScrapeRequest } from '../utils/validation.js';

export async function scrapePlaces(request, response, next) {
  try {
    const input = validateScrapeRequest(request.body);
    const rows = await runPlaceScrape(input);
    response.json({ rows, csv: toCsv(rows) });
  } catch (error) {
    next(error);
  }
}

import { httpError } from './httpError.js';

export const CATEGORY_KEYWORDS = {
  'Personal Care & Grooming Services': ['barbershop', 'salon', 'nail salon', 'spa', 'massage'],
  'Specialty Retail & Boutique Shops': ['boutique', 'gift shop', 'flower shop', 'bookstore', 'thrift shop'],
  'Food, Beverage & Entertainment (Discretionary Dining)': [
    'coffee shop',
    'cafe',
    'bakery',
    'restaurant',
    'bar'
  ]
};

export function validateScrapeRequest(body) {
  const city = normalizeText(body?.city);
  const category = normalizeText(body?.category);
  const keyword = normalizeText(body?.keyword);
  const limit = Number(body?.limit || 50);
  const maxResults = Number(process.env.SCRAPER_MAX_RESULTS || 50);

  if (city.length < 2 || city.length > 90) {
    throw httpError(400, 'City must be between 2 and 90 characters.');
  }

  if (!CATEGORY_KEYWORDS[category]) {
    throw httpError(400, 'Choose one of the supported categories.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > maxResults) {
    throw httpError(400, `Limit must be between 1 and ${maxResults}.`);
  }

  const allowedKeywords = CATEGORY_KEYWORDS[category];
  const requestedKeyword = keyword || allowedKeywords[0];
  if (!allowedKeywords.includes(requestedKeyword)) {
    throw httpError(400, 'Choose one of the supported business types.');
  }

  return {
    city,
    category,
    keyword: requestedKeyword,
    limit
  };
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

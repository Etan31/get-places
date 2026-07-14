import { chromium } from 'playwright';

const DASH = '-';
const MAPS_BASE_URL = 'https://www.google.com/maps/search/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';

const CONCURRENCY = Math.max(1, Number(process.env.SCRAPER_CONCURRENCY || 5));

export async function runPlaceScrape(
  { city, category, keyword, limit },
  { onEvent = () => {}, isCancelled = () => false } = {}
) {
  const browser = await chromium.launch({
    headless: process.env.SCRAPER_HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: 'en-US',
      viewport: { width: 1365, height: 900 }
    });

    // Google gates Maps behind a GDPR consent redirect (consent.google.com) for
    // EU-detected IPs (e.g. Fly's Amsterdam region), rendered in whatever local
    // language it infers from the IP - not our Accept-Language header. Rather
    // than chase localized button text, pre-set the cookie Google itself sets
    // once consent is given, so it skips the interstitial entirely.
    await context.addCookies([
      {
        name: 'CONSENT',
        value: `YES+cb.20240101-00-p0.en+FX+${Math.floor(100 + Math.random() * 800)}`,
        domain: '.google.com',
        path: '/'
      }
    ]);

    const searchPage = await context.newPage();
    searchPage.setDefaultTimeout(12_000);

    onEvent({ type: 'status', message: `Searching Google Maps for "${keyword} in ${city}"...` });
    const places = await collectPlaces(searchPage, `${keyword} in ${city}`, limit, isCancelled);
    onEvent({
      type: 'status',
      message: `Found ${places.length} place${places.length === 1 ? '' : 's'}, checking them now (${Math.min(CONCURRENCY, places.length) || 1} at a time)...`
    });

    return await scrapePlacesConcurrently(context, places, { city, category, keyword, limit, onEvent, isCancelled });
  } finally {
    await browser.close();
  }
}

async function scrapePlacesConcurrently(context, places, { city, category, keyword, limit, onEvent, isCancelled }) {
  const rows = [];
  const seenNames = new Set();
  let cursor = 0;
  let committed = 0;
  const workerCount = Math.min(CONCURRENCY, places.length) || 1;

  async function worker() {
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);

    try {
      while (!isCancelled() && committed < limit) {
        const place = places[cursor];
        cursor += 1;
        if (!place) break;

        const details = await scrapePlaceDetails(page, place.url);
        const shopName = clean(details.shopName || place.name);
        if (!shopName || seenNames.has(shopName.toLowerCase())) continue;
        if (committed >= limit) break;

        seenNames.add(shopName.toLowerCase());
        committed += 1;

        const webSignals = details.website ? await scrapeWebsiteSignals(context, details.website) : {};

        const row = {
          shopName,
          email: webSignals.email || DASH,
          number: clean(details.number) || DASH,
          accountLink: webSignals.accountLink || DASH,
          facebookLink: webSignals.facebookLink || DASH,
          category: clean(details.category) || keyword || category,
          location: clean(details.location) || city,
          mapsUrl: place.url
        };

        rows.push(row);
        onEvent({ type: 'row', row, index: rows.length, total: limit });

        if (committed < limit && !isCancelled()) {
          await page.waitForTimeout(randomDelay(1_200, 2_600));
        }
      }
    } finally {
      await page.close();
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return rows;
}

function randomDelay(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

async function collectPlaces(page, query, limit, isCancelled = () => false) {
  const searchUrl = `${MAPS_BASE_URL}${encodeURIComponent(query)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await acceptConsentIfPresent(page);

  const places = new Map();
  const feed = page.locator('div[role="feed"]').first();

  for (let attempt = 0; attempt < 24 && places.size < limit && !isCancelled(); attempt += 1) {
    const links = await page
      .locator('a[href*="/maps/place/"]')
      .evaluateAll((anchors) =>
        anchors
          .map((anchor) => ({
            name: anchor.getAttribute('aria-label') || anchor.textContent || '',
            url: anchor.href
          }))
          .filter((item) => item.url)
      )
      .catch(() => []);

    for (const link of links) {
      const normalizedUrl = normalizeMapsUrl(link.url);
      if (!places.has(normalizedUrl)) {
        places.set(normalizedUrl, {
          name: clean(link.name),
          url: normalizedUrl
        });
      }
      if (places.size >= limit) break;
    }

    if (places.size >= limit) break;

    if ((await feed.count()) > 0) {
      await feed.evaluate((node) => {
        node.scrollBy(0, node.scrollHeight);
      });
    } else {
      await page.mouse.wheel(0, 1200);
    }
    await page.waitForTimeout(randomDelay(700, 1_300));
  }

  if (places.size === 0) {
    await logEmptySearchDiagnostics(page, searchUrl);
  }

  return Array.from(places.values()).slice(0, limit);
}

async function logEmptySearchDiagnostics(page, searchUrl) {
  const diagnostics = await page
    .evaluate(() => ({
      title: document.title,
      bodySnippet: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300),
      hasFeed: !!document.querySelector('div[role="feed"]'),
      hasPlaceLinks: !!document.querySelector('a[href*="/maps/place/"]')
    }))
    .catch((error) => ({ evaluateError: String(error) }));

  console.error('No places found for search:', {
    searchUrl,
    finalUrl: page.url(),
    ...diagnostics
  });
}

async function scrapePlaceDetails(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(1_200);

  return page.evaluate(() => {
    const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
    const getByDataId = (value) => {
      const node = document.querySelector(`[data-item-id="${value}"]`);
      return node?.getAttribute('aria-label') || node?.textContent || '';
    };
    const phoneNode = document.querySelector('[data-item-id^="phone:tel:"]');
    const websiteNode = document.querySelector('a[data-item-id="authority"]');
    const categoryNode =
      document.querySelector('button[jsaction*="pane.rating.category"]') ||
      document.querySelector('button[aria-label*="Category"]');

    return {
      shopName: getText('h1'),
      category: categoryNode?.textContent?.trim() || '',
      location: getByDataId('address').replace(/^Address:\s*/i, '').trim(),
      number: (phoneNode?.getAttribute('aria-label') || phoneNode?.textContent || '')
        .replace(/^Phone:\s*/i, '')
        .trim(),
      website: websiteNode?.href || ''
    };
  });
}

async function scrapeWebsiteSignals(context, websiteUrl) {
  const page = await context.newPage();
  page.setDefaultTimeout(7_000);

  try {
    const urlsToVisit = await getWebsitePagesToCheck(page, websiteUrl);
    const signals = { email: '', accountLink: '', facebookLink: '' };

    for (const url of urlsToVisit) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8_000 }).catch(() => {});
      const pageSignals = await extractSignals(page);
      signals.email ||= pageSignals.email;
      signals.accountLink ||= pageSignals.accountLink;
      signals.facebookLink ||= pageSignals.facebookLink;
      if (signals.email && signals.accountLink && signals.facebookLink) break;
    }

    return signals;
  } catch {
    return {};
  } finally {
    await page.close();
  }
}

async function getWebsitePagesToCheck(page, websiteUrl) {
  const normalized = safeUrl(websiteUrl);
  if (!normalized) return [];

  await page.goto(normalized, { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => {});
  const contactLinks = await page
    .locator('a[href]')
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => ({
          text: anchor.textContent || '',
          href: anchor.href || ''
        }))
        .filter((anchor) => /contact|about|location|visit/i.test(anchor.text))
        .map((anchor) => anchor.href)
        .slice(0, 1)
    )
    .catch(() => []);

  return [normalized, ...contactLinks].filter(Boolean);
}

async function extractSignals(page) {
  return page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const text = document.body?.innerText || '';
    const emailMatches = `${html} ${text}`.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    const anchors = Array.from(document.querySelectorAll('a[href]')).map((anchor) => anchor.href);
    const socialLink = anchors.find((href) => /facebook\.com|instagram\.com|tiktok\.com/i.test(href));
    const facebookLink = anchors.find((href) => /facebook\.com/i.test(href));
    const mailto = anchors.find((href) => href.startsWith('mailto:'));
    const email = cleanEmail(mailto?.replace(/^mailto:/i, '').split('?')[0] || emailMatches[0] || '');

    return {
      email,
      accountLink: socialLink || '',
      facebookLink: facebookLink || ''
    };
  });
}

async function acceptConsentIfPresent(page) {
  // Fallback for whatever the CONSENT cookie doesn't cover - Google renders this
  // wall in whatever language it infers from the request's IP, not our
  // Accept-Language header, so match the common EU phrasings too.
  const consentButtons = [
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Reject all")',
    'button:has-text("Alles accepteren")', // Dutch
    'button:has-text("Tout accepter")', // French
    'button:has-text("Alle akzeptieren")', // German
    'button:has-text("Aceptar todo")', // Spanish
    'button:has-text("Accetta tutto")', // Italian
    'button:has-text("Aceitar tudo")' // Portuguese
  ];

  for (const selector of consentButtons) {
    const button = page.locator(selector).first();
    if ((await button.count()) > 0) {
      await button.click().catch(() => {});
      await page.waitForTimeout(500);
      return;
    }
  }
}

function normalizeMapsUrl(url) {
  return String(url || '').split('&')[0];
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanEmail(value) {
  return clean(value).replace(/^mailto:/i, '').replace(/[),.;]+$/g, '');
}

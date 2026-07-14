import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, MapPin, Play, Scissors, Search, Store } from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const CATEGORIES = [
  {
    label: 'Personal Care & Grooming Services',
    icon: Scissors,
    keywords: ['barbershop', 'salon', 'nail salon', 'spa', 'massage']
  },
  {
    label: 'Specialty Retail & Boutique Shops',
    icon: Store,
    keywords: ['boutique', 'gift shop', 'flower shop', 'bookstore', 'thrift shop']
  },
  {
    label: 'Food, Beverage & Entertainment (Discretionary Dining)',
    icon: MapPin,
    keywords: ['coffee shop', 'cafe', 'bakery', 'restaurant', 'bar']
  }
];

function App() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [keyword, setKeyword] = useState(CATEGORIES[0].keywords[0]);
  const [limit, setLimit] = useState(50);
  const [rows, setRows] = useState([]);
  const [csv, setCsv] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const selectedCategory = useMemo(
    () => CATEGORIES.find((item) => item.label === category) || CATEGORIES[0],
    [category]
  );

  const canRun = city.trim().length >= 2 && status !== 'loading';

  function handleCategoryChange(nextCategory) {
    const next = CATEGORIES.find((item) => item.label === nextCategory) || CATEGORIES[0];
    setCategory(next.label);
    setKeyword(next.keywords[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canRun) return;

    setStatus('loading');
    setError('');
    setRows([]);
    setCsv('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          category,
          keyword: keyword.trim(),
          limit: Number(limit)
        })
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || 'Scrape failed');
      }

      setRows(data.rows || []);
      setCsv(data.csv || '');
      setStatus('done');
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
      setStatus('error');
    }
  }

  function downloadCsv() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `places-${city.trim().replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="scraper-panel" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Personal local lead finder</p>
          <h1 id="page-title">Get 50 public business leads by city.</h1>
          <p>
            Search a city, choose a category, preview the rows, then download a CSV with shop
            names, contacts, social links, category, and location.
          </p>
        </div>

        <form className="scrape-form" onSubmit={handleSubmit}>
          <label>
            City
            <div className="input-shell">
              <Search size={18} aria-hidden="true" />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Cebu City, Manila, Davao..."
                autoComplete="address-level2"
              />
            </div>
          </label>

          <label>
            Category
            <select value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Business type
            <select value={keyword} onChange={(event) => setKeyword(event.target.value)}>
              {selectedCategory.keywords.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Daily rows
            <input
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </label>

          <button className="primary-action" type="submit" disabled={!canRun}>
            <Play size={18} aria-hidden="true" />
            {status === 'loading' ? 'Scraping...' : 'Start scrape'}
          </button>
        </form>
      </section>

      <section className="results-band" aria-live="polite">
        <div className="result-topline">
          <div>
            <span className="metric">{rows.length}</span>
            <span className="metric-label">rows ready</span>
          </div>
          <button className="download-action" type="button" onClick={downloadCsv} disabled={!csv}>
            <Download size={18} aria-hidden="true" />
            CSV
          </button>
        </div>

        {error && <p className="status-message error">{error}</p>}
        {status === 'loading' && (
          <p className="status-message">Collecting public listings and checking websites for contacts.</p>
        )}
        {status === 'idle' && <p className="status-message">Your scrape results will appear here.</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Email</th>
                <th>Number</th>
                <th>Account Link(FB, Tiktok, IG)</th>
                <th>Category</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No rows yet
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.shopName}-${index}`}>
                    <td>{row.shopName}</td>
                    <td>{row.email}</td>
                    <td>{row.number}</td>
                    <td>
                      {row.accountLink.startsWith('http') ? (
                        <a href={row.accountLink} target="_blank" rel="noreferrer">
                          {row.accountLink}
                        </a>
                      ) : (
                        row.accountLink
                      )}
                    </td>
                    <td>{row.category}</td>
                    <td>{row.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected response from the scraper API (${response.status}).` };
  }
}

function getRequestErrorMessage(error) {
  if (error instanceof TypeError) {
    return `Could not reach the scraper API at ${API_BASE_URL}. Check that the server is running and that this page is allowed by CORS.`;
  }

  return error.message || 'Scrape failed';
}

createRoot(document.getElementById('root')).render(<App />);

import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Download,
  Loader2,
  MapPin,
  Play,
  Scissors,
  Search,
  Store,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const CATEGORIES = [
  {
    label: "Personal Care & Grooming Services",
    icon: Scissors,
    keywords: ["barbershop", "salon", "nail salon", "spa", "massage"],
  },
  {
    label: "Specialty Retail & Boutique Shops",
    icon: Store,
    keywords: [
      "boutique",
      "gift shop",
      "flower shop",
      "bookstore",
      "thrift shop",
    ],
  },
  {
    label: "Food, Beverage & Entertainment (Discretionary Dining)",
    icon: MapPin,
    keywords: ["coffee shop", "cafe", "bakery", "restaurant", "bar"],
  },
];

function App() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [keyword, setKeyword] = useState(CATEGORIES[0].keywords[0]);
  const [limit, setLimit] = useState(50);
  const [rows, setRows] = useState([]);
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");

  const selectedCategory = useMemo(
    () => CATEGORIES.find((item) => item.label === category) || CATEGORIES[0],
    [category],
  );

  const canRun = city.trim().length >= 2 && status !== "loading";

  function handleCategoryChange(nextCategory) {
    const next =
      CATEGORIES.find((item) => item.label === nextCategory) || CATEGORIES[0];
    setCategory(next.label);
    setKeyword(next.keywords[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canRun) return;

    setStatus("loading");
    setError("");
    setRows([]);
    setCsv("");
    setProgressMessage("Starting scrape...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          category,
          keyword: keyword.trim(),
          limit: Number(limit),
        }),
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response);
        throw new Error(data.error || "Scrape failed");
      }

      const { rows: finalRows, csv: finalCsv } = await readScrapeStream(
        response,
        setRows,
        setProgressMessage,
      );

      setCsv(finalCsv);
      setStatus("done");
      if (finalRows.length === 0) {
        setProgressMessage("No public listings found for that search.");
      }
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
      setStatus("error");
    }
  }

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `places-${city.trim().replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="scraper-panel" aria-labelledby="page-title">
        <div className="intro">
          <div className="brand-mark">
            <span className="brand-badge" aria-hidden="true">
              GP
            </span>
            <span className="brand-name">Get Places</span>
          </div>
          <p className="eyebrow">Personal local lead finder</p>
          <h1 id="page-title">Get 50 public business leads by city.</h1>
          <p>
            Search a city, choose a category, preview the rows, then download a
            CSV with shop names, contacts, social links, category, and location.
          </p>
        </div>

        <form className="scrape-form" onSubmit={handleSubmit}>
          <div>
            <div className="input-label">
              <label>City </label>{" "}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
            </div>
            <div className="input-shell">
              <Search size={18} aria-hidden="true" />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Cebu City, Manila, Davao..."
                autoComplete="address-level2"
                aria-required="true"
              />
            </div>
          </div>

          <label>
            Category
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Business type
            <select
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            >
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
              max="100"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </label>

          <button className="primary-action" type="submit" disabled={!canRun}>
            {status === "loading" ? (
              <Loader2 size={18} aria-hidden="true" className="spin-icon" />
            ) : (
              <Play size={18} aria-hidden="true" />
            )}
            {status === "loading"
              ? `Scraping... (${rows.length}/${limit})`
              : "Start scrape"}
          </button>
        </form>
      </section>

      <section className="results-band">
        <div className="result-topline">
          <div>
            <span className="metric">{rows.length}</span>
            <span className="metric-label">rows ready</span>
          </div>
          <button
            className="download-action"
            type="button"
            onClick={downloadCsv}
            disabled={!csv}
          >
            <Download size={18} aria-hidden="true" />
            CSV
          </button>
        </div>

        <div className="status-region" aria-live="polite" aria-atomic="true">
          {error && <p className="status-message error">{error}</p>}
          {status === "loading" && (
            <p className="status-message">
              {progressMessage ||
                "Collecting public listings and checking websites for contacts."}
            </p>
          )}
          {status === "done" && progressMessage && (
            <p className="status-message">{progressMessage}</p>
          )}
          {status === "idle" && (
            <p className="status-message">
              Your scrape results will appear here.
            </p>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Shop Name</th>
                <th scope="col">Email</th>
                <th scope="col">Number</th>
                <th scope="col">Account Link(FB, Tiktok, IG)</th>
                <th scope="col">Facebook</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                <th scope="col">Google Maps</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
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
                      {row.accountLink.startsWith("http") ? (
                        <a
                          href={row.accountLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.accountLink}
                        </a>
                      ) : (
                        row.accountLink
                      )}
                    </td>
                    <td>
                      {row.facebookLink?.startsWith("http") ? (
                        <a
                          href={row.facebookLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.facebookLink}
                        </a>
                      ) : (
                        row.facebookLink || "-"
                      )}
                    </td>
                    <td>{row.category}</td>
                    <td>{row.location}</td>
                    <td>
                      {row.mapsUrl?.startsWith("http") ? (
                        <a href={row.mapsUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
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

async function readScrapeStream(response, setRows, setProgressMessage) {
  const rows = [];
  let csv = "";
  let streamError = "";

  const reader = response.body?.getReader();
  if (!reader) {
    const data = await parseJsonResponse(response);
    setRows(data.rows || []);
    return { rows: data.rows || [], csv: data.csv || "" };
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
      if (!line) continue;

      const scrapeEvent = parseEventLine(line);
      if (!scrapeEvent) continue;

      if (scrapeEvent.type === "status") {
        setProgressMessage(scrapeEvent.message);
      } else if (scrapeEvent.type === "row") {
        rows.push(scrapeEvent.row);
        setRows([...rows]);
        setProgressMessage(
          `Found ${scrapeEvent.index} of ${scrapeEvent.total} rows...`,
        );
      } else if (scrapeEvent.type === "done") {
        csv = scrapeEvent.csv || "";
      } else if (scrapeEvent.type === "error") {
        streamError = scrapeEvent.message;
      }
    }
  }

  if (streamError) throw new Error(streamError);

  return { rows, csv };
}

function parseEventLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `Unexpected response from the scraper API (${response.status}).`,
    };
  }
}

function getRequestErrorMessage(error) {
  if (error instanceof TypeError) {
    return `Could not reach the scraper API at ${API_BASE_URL}. Check that the server is running and that this page is allowed by CORS.`;
  }

  return error.message || "Scrape failed";
}

createRoot(document.getElementById("root")).render(<App />);

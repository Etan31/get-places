import React, { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import ScraperForm from "./components/ScraperForm";
import ResultsPanel from "./components/ResultsPanel";
import { initialFormValues } from "./config";
import { getRequestErrorMessage, startScrape } from "./lib/scrape";

const STATUS_LABELS = {
  idle: "Ready",
  loading: "Scraping…",
  done: "Complete",
  error: "Failed",
};

export default function App() {
  const [values, setValues] = useState(initialFormValues);
  const [rows, setRows] = useState([]);
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");

  const limit = Number(values.limit) || 100;

  const statusPill = useMemo(() => {
    if (status === "loading") {
      return { tone: "loading", label: `Scraping… ${rows.length}/${limit}` };
    }
    return { tone: status, label: STATUS_LABELS[status] };
  }, [status, rows.length, limit]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (values.city.trim().length < 2 || status === "loading") return;

    setStatus("loading");
    setError("");
    setRows([]);
    setCsv("");
    setProgressMessage("Starting scrape…");

    try {
      const { rows: finalRows, csv: finalCsv } = await startScrape(
        {
          city: values.city.trim(),
          category: values.category,
          keyword: values.keyword.trim(),
          limit,
        },
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
    link.download = `places-${values.city.trim().replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <MapPin size={18} />
          </span>
          <div className="brand-text">
            <span className="brand-name">Get Places</span>
            <span className="brand-tag">Local lead finder</span>
          </div>
        </div>

        <span className={`status-pill ${statusPill.tone}`}>
          <span className="status-dot" aria-hidden="true" />
          {statusPill.label}
        </span>
      </header>

      <main className="layout">
        <ScraperForm
          values={values}
          setValues={setValues}
          status={status}
          rows={rows}
          limit={limit}
          onSubmit={handleSubmit}
        />

        <ResultsPanel
          status={status}
          error={error}
          progressMessage={progressMessage}
          rows={rows}
          limit={limit}
          csv={csv}
          onDownload={downloadCsv}
        />
      </main>

      <footer className="app-footer">
        <p>Collects publicly listed business info only · Stops at your configured limit</p>
      </footer>
    </div>
  );
}

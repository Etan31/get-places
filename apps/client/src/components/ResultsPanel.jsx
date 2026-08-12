import React from "react";
import { AlertCircle, CheckCircle2, Download, Inbox, Search } from "lucide-react";
import { RESULT_COLUMNS } from "../config";

/** Declarative summary metrics shown above the table. */
function buildMetrics(status, rows, limit) {
  const progress =
    status === "done" ? 100 : Math.min(100, Math.round((rows.length / Math.max(limit, 1)) * 100));
  return [
    { key: "found", label: "Rows found", value: rows.length, tone: "accent" },
    { key: "target", label: "Target", value: limit, tone: "" },
    { key: "progress", label: "Complete", value: `${progress}%`, tone: "success" },
  ];
}

export default function ResultsPanel({
  status,
  error,
  progressMessage,
  rows,
  limit,
  csv,
  onDownload,
}) {
  const metrics = buildMetrics(status, rows, limit);
  const progress =
    status === "done" ? 100 : Math.min(100, Math.round((rows.length / Math.max(limit, 1)) * 100));

  return (
    <section className="results" aria-labelledby="results-title">
      <div className="results-head">
        <div>
          <h2 id="results-title">Results</h2>
          <p>Preview rows as they stream in, then download the CSV.</p>
        </div>
        <button
          className="download-action"
          type="button"
          onClick={onDownload}
          disabled={!csv}
        >
          <Download size={16} aria-hidden="true" />
          Download CSV
        </button>
      </div>

      <div className="metrics" aria-hidden="true">
        {metrics.map((metric) => (
          <div key={metric.key} className={`metric-card card${metric.tone ? ` ${metric.tone}` : ""}`}>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="status-region" aria-live="polite" aria-atomic="true">
        {status === "loading" && (
          <div className="alert info">
            <Search size={17} aria-hidden="true" className="alert-icon" />
            <div className="alert-body">
              <p>{progressMessage || "Collecting public listings and checking websites for contacts…"}</p>
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {status === "done" && progressMessage && (
          <div className="alert done">
            <CheckCircle2 size={17} aria-hidden="true" className="alert-icon" />
            <p>{progressMessage}</p>
          </div>
        )}

        {status === "error" && (
          <div className="alert error">
            <AlertCircle size={17} aria-hidden="true" className="alert-icon" />
            <p>{error}</p>
          </div>
        )}

        {status === "idle" && (
          <div className="alert neutral">
            <Inbox size={17} aria-hidden="true" className="alert-icon" />
            <p>Run a search to see results here. Rows appear live as they're found.</p>
          </div>
        )}
      </div>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              {RESULT_COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={RESULT_COLUMNS.length} className="empty-row">
                  <span className="empty-hint">No rows yet</span>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.shopName}-${index}`}>
                  {RESULT_COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.label}
                      className={column.mono ? "mono" : ""}
                    >
                      {column.render ? column.render(row) : row[column.key] || <Dash />}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Dash() {
  return <span className="dash">—</span>;
}

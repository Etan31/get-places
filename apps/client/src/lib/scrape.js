export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * POST a scrape request and read the newline-delimited JSON stream,
 * calling `setRows` and `setProgressMessage` as rows arrive.
 */
export async function startScrape(payload, setRows, setProgressMessage) {
  const response = await fetch(`${API_BASE_URL}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw new Error(data.error || "Scrape failed");
  }

  return readScrapeStream(response, setRows, setProgressMessage);
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
        setProgressMessage(`Found ${scrapeEvent.index} of ${scrapeEvent.total} rows...`);
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

export function getRequestErrorMessage(error) {
  if (error instanceof TypeError) {
    return `Could not reach the scraper API at ${API_BASE_URL}. Check that the server is running and that this page is allowed by CORS.`;
  }

  return error.message || "Scrape failed";
}

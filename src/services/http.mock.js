/**
 * Temporary stand-in for the HTTP client.
 *
 * Every service function resolves through `respond()` so the UI already deals
 * with async data, loading states and (eventually) errors. When the real API
 * lands, swap the body of each service for a `fetch`/axios call and delete
 * this file together with `src/mock/`.
 */

const LATENCY_MS = 180;

export function respond(data, { delay = LATENCY_MS } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delay);
  });
}

/** Case-insensitive "does any of these fields contain the query" filter. */
export function search(rows, query, fields) {
  if (!query) return rows;
  const needle = String(query).trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    fields.some((field) => String(row[field] ?? "").toLowerCase().includes(needle))
  );
}

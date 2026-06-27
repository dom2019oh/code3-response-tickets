import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Persisted on a Railway volume when TICKETS_COUNTER_PATH is set (survives
// redeploys); otherwise a local file is used (resets when the container does).
const here = dirname(fileURLToPath(import.meta.url));
const STORE = process.env.TICKETS_COUNTER_PATH ?? join(here, '..', 'data', 'counter.json');

/** Increment and return the next ticket number (shared across all types). */
export function nextTicketNumber() {
  let count = 0;
  try {
    count = JSON.parse(readFileSync(STORE, 'utf8')).count ?? 0;
  } catch {
    /* first run — the file does not exist yet */
  }
  count += 1;
  try {
    mkdirSync(dirname(STORE), { recursive: true });
    writeFileSync(STORE, JSON.stringify({ count }));
  } catch (err) {
    console.error('[Tickets] counter store write failed:', err);
  }
  return count;
}

/** Format a ticket number + type as the channel name, e.g. "0001-moderation". */
export const ticketName = (n, typeKey) => `${String(n).padStart(4, '0')}-${typeKey}`;

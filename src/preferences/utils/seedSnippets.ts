import type { TableRow } from '../components/TextSnippetsTable'
import { DEFAULT_ROWS } from '../data/defaultSnippets'

export const SNIPPETS_STORAGE_KEY = 'charge-capture-text-snippets'

// Defaults are only added once per browser, so snippets deleted by the user stay deleted
// while newly shipped defaults still reach browsers that seeded an earlier release.
const SEEDED_DEFAULT_IDS_KEY = 'charge-capture-seeded-default-snippets'

function readSeededIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEDED_DEFAULT_IDS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeSeededIds(ids: string[]) {
  try {
    localStorage.setItem(SEEDED_DEFAULT_IDS_KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    /* ignore quota errors */
  }
}

function writeRows(rows: TableRow[]) {
  try {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(rows))
  } catch {
    /* ignore quota errors */
  }
}

function readRows(): TableRow[] | null {
  try {
    const raw = localStorage.getItem(SNIPPETS_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as TableRow[]) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

/**
 * Returns the snippet rows this browser should use, writing them to storage so the
 * visit note picks them up even when the Preferences page was never opened.
 */
export function ensureSnippetsSeeded(): TableRow[] {
  const saved = readRows()
  if (!saved) {
    writeRows(DEFAULT_ROWS)
    writeSeededIds(DEFAULT_ROWS.map(row => row.id))
    return DEFAULT_ROWS
  }

  const seeded = new Set([...readSeededIds(), ...saved.map(row => row.id)])
  const missing = DEFAULT_ROWS.filter(row => !seeded.has(row.id))
  if (missing.length === 0) return saved

  const merged = [...saved, ...missing]
  writeRows(merged)
  writeSeededIds([...seeded, ...missing.map(row => row.id)])
  return merged
}

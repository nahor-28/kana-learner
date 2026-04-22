import type { Card, ReviewLog, Settings } from '../data/kana';

export const SCHEMA_VERSION = 1;

interface BackupPayload {
  schemaVersion: number;
  exportedAt: number;
  cards: Card[];
  logs: ReviewLog[];
  settings: Settings;
}

export function serialize(cards: Card[], logs: ReviewLog[], settings: Settings): string {
  const payload: BackupPayload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    cards,
    logs,
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function deserialize(json: string): { cards: Card[]; logs: ReviewLog[]; settings: Settings } {
  let payload: BackupPayload;
  try {
    payload = JSON.parse(json) as BackupPayload;
  } catch {
    throw new Error('Invalid backup file: not valid JSON');
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `Schema version mismatch: expected ${SCHEMA_VERSION}, got ${payload.schemaVersion}`,
    );
  }
  return { cards: payload.cards, logs: payload.logs, settings: payload.settings };
}

export async function exportData(cards: Card[], logs: ReviewLog[], settings: Settings): Promise<void> {
  const json = serialize(cards, logs, settings);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kana-srs-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(
  file: File,
): Promise<{ cards: Card[]; logs: ReviewLog[]; settings: Settings }> {
  const text = await file.text();
  return deserialize(text);
}

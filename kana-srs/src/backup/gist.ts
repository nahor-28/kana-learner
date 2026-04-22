import { serialize, deserialize } from './json';
import type { Card, ReviewLog, Settings } from '../data/kana';

const GIST_FILENAME = 'kana-srs-backup.json';
const API = 'https://api.github.com';

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  const delays = [1000, 5000, 30000];
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  }
  throw lastError;
}

export async function syncToGist(
  token: string,
  cards: Card[],
  logs: ReviewLog[],
  settings: Settings,
  gistId?: string,
): Promise<string> {
  const content = serialize(cards, logs, settings);
  const body = JSON.stringify({
    description: 'Kana SRS backup',
    public: false,
    files: { [GIST_FILENAME]: { content } },
  });
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  };

  const url = gistId ? `${API}/gists/${gistId}` : `${API}/gists`;
  const method = gistId ? 'PATCH' : 'POST';

  const res = await fetchWithRetry(url, { method, headers, body });
  if (!res.ok) {
    throw new Error(`Gist API error ${res.status}: ${res.statusText}`);
  }
  const data = await res.json() as { id: string };
  return data.id;
}

export async function fetchFromGist(
  token: string,
  gistId: string,
): Promise<{ cards: Card[]; logs: ReviewLog[]; settings: Settings; exportedAt: number }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const res = await fetchWithRetry(`${API}/gists/${gistId}`, { headers });
  if (!res.ok) {
    throw new Error(`Gist API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json() as { files: Record<string, { content: string }> };
  const file = data.files[GIST_FILENAME];
  if (!file) {
    throw new Error('Backup file not found in gist');
  }

  const parsed = deserialize(file.content);
  const payload = JSON.parse(file.content) as { exportedAt: number };
  return { ...parsed, exportedAt: payload.exportedAt };
}

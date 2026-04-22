import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedCards } from '../data/db';
import { exportData, importData } from '../backup/json';
import { syncToGist, fetchFromGist } from '../backup/gist';
import type { DeckScope } from '../data/kana';

const SCOPE_OPTIONS: { value: DeckScope; label: string }[] = [
  { value: 'hiragana-basic', label: 'Hiragana basic' },
  { value: 'katakana-basic', label: 'Katakana basic' },
  { value: 'hiragana-all', label: 'Hiragana all' },
  { value: 'katakana-all', label: 'Katakana all' },
  { value: 'both-all', label: 'Both — hiragana + katakana' },
];

export function Settings() {
  const [toast, setToast] = useState('');
  const [gistToken, setGistToken] = useState('');
  const [syncing, setSyncing] = useState(false);

  const settings = useLiveQuery(() => db.settings.get('singleton'));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleExport() {
    if (!settings) return;
    const cards = await db.cards.toArray();
    const logs = await db.logs.toArray();
    await exportData(cards, logs, settings);
    showToast('Export started');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { cards, logs, settings: importedSettings } = await importData(file);
      await db.transaction('rw', db.cards, db.logs, db.settings, async () => {
        await db.cards.clear();
        await db.logs.clear();
        await db.settings.clear();
        await db.cards.bulkPut(cards);
        await db.logs.bulkPut(logs);
        await db.settings.put(importedSettings);
      });
      showToast('Import successful');
    } catch (err) {
      showToast(`Import failed: ${(err as Error).message}`);
    }
    e.target.value = '';
  }

  async function handleScopeChange(scope: DeckScope) {
    if (!settings) return;
    await db.settings.update('singleton', { deckScope: scope });
    await seedCards(scope);
    showToast('Scope updated — new cards added');
  }

  async function handleGistSync() {
    if (!settings || !gistToken) return;
    setSyncing(true);
    try {
      const cards = await db.cards.toArray();
      const logs = await db.logs.toArray();
      const gistId = await syncToGist(gistToken, cards, logs, settings, settings.gistSync.gistId);
      const now = Date.now();
      await db.settings.update('singleton', {
        gistSync: { enabled: true, token: gistToken, gistId, lastSync: now },
      });
      showToast('Synced to Gist');
    } catch (err) {
      showToast(`Gist sync failed: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleGistPull() {
    if (!settings?.gistSync.token || !settings.gistSync.gistId) return;
    setSyncing(true);
    try {
      const remote = await fetchFromGist(settings.gistSync.token, settings.gistSync.gistId);
      const localSync = settings.gistSync.lastSync ?? 0;
      if (remote.exportedAt <= localSync) {
        showToast('Local data is already up to date');
        return;
      }
      const confirmed = window.confirm('Remote backup is newer. Replace local data?');
      if (!confirmed) return;
      await db.transaction('rw', db.cards, db.logs, db.settings, async () => {
        await db.cards.clear();
        await db.logs.clear();
        await db.settings.clear();
        await db.cards.bulkPut(remote.cards);
        await db.logs.bulkPut(remote.logs);
        await db.settings.put(remote.settings);
      });
      showToast('Pulled from Gist');
    } catch (err) {
      showToast(`Gist pull failed: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md mx-auto w-full">
      <h2 className="text-2xl font-bold">Settings</h2>

      {settings && (
        <div>
          <p className="text-sm opacity-60 mb-2">Welcome back, {settings.userName}</p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold opacity-75 uppercase tracking-wider">Deck scope</h3>
        <div className="flex flex-col gap-2">
          {SCOPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleScopeChange(opt.value)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-left"
              style={{
                background: settings?.deckScope === opt.value ? 'var(--color-accent)' : 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              {settings?.deckScope === opt.value ? '●' : '○'} {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold opacity-75 uppercase tracking-wider">Backup</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)' }}
          >
            Export JSON
          </button>
          <label
            className="flex-1 py-2 rounded-lg text-sm font-medium text-center cursor-pointer"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)' }}
          >
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold opacity-75 uppercase tracking-wider">GitHub Gist sync</h3>
        <p className="text-xs opacity-50">Paste a GitHub PAT with gist scope only. Stored on-device only.</p>
        <input
          type="password"
          value={gistToken || settings?.gistSync.token || ''}
          onChange={e => setGistToken(e.target.value)}
          placeholder="github_pat_..."
          className="px-4 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)' }}
        />
        <div className="flex gap-3">
          <button
            onClick={handleGistSync}
            disabled={syncing || !gistToken}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {syncing ? 'Syncing…' : 'Push to Gist'}
          </button>
          {settings?.gistSync.gistId && (
            <button
              onClick={handleGistPull}
              disabled={syncing}
              className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)' }}
            >
              Pull from Gist
            </button>
          )}
        </div>
        {settings?.gistSync.lastSync && (
          <p className="text-xs opacity-50">
            Last sync: {new Date(settings.gistSync.lastSync).toLocaleString()}
          </p>
        )}
      </section>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-text)' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

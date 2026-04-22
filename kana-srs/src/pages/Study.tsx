import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { filterCardsByScope } from '../data/kana';
import { StudyGrid } from '../components/StudyGrid';
import type { Card } from '../data/kana';

type Tab = 'hiragana' | 'katakana' | 'dakuten';

const TABS: { id: Tab; label: string }[] = [
  { id: 'hiragana', label: 'Hiragana' },
  { id: 'katakana', label: 'Katakana' },
  { id: 'dakuten', label: 'Dakuten' },
];

function filterTab(cards: Card[], tab: Tab): Card[] {
  switch (tab) {
    case 'hiragana':
      return cards.filter(c => c.kind === 'hiragana' && c.group === 'base');
    case 'katakana':
      return cards.filter(c => c.kind === 'katakana' && c.group === 'base');
    case 'dakuten':
      return cards.filter(c => c.group === 'dakuten' || c.group === 'handakuten');
  }
}

export function Study() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('hiragana');
  const [hideRomaji, setHideRomaji] = useState(false);

  const data = useLiveQuery(async () => {
    const settings = await db.settings.get('singleton');
    if (!settings) return null;
    const scopedCards = filterCardsByScope(settings.deckScope);
    const dbCards = await db.cards.toArray();
    const dbIds = new Set(dbCards.map(c => c.id));
    // Only show cards actually seeded in the user's db (respects scope)
    return scopedCards.filter(c => dbIds.has(c.id));
  });

  const tabCards = data ? filterTab(data, activeTab) : [];
  const isEmpty = data !== undefined && tabCards.length === 0;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate('/')} className="text-sm opacity-50">
          ← Back
        </button>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className="opacity-60">Hide romaji</span>
          <span
            role="checkbox"
            aria-checked={hideRomaji}
            tabIndex={0}
            onClick={() => setHideRomaji(v => !v)}
            onKeyDown={e => e.key === ' ' && setHideRomaji(v => !v)}
            className="relative inline-block rounded-full transition-colors"
            style={{
              width: 40,
              height: 24,
              background: hideRomaji ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
              cursor: 'pointer',
            }}
          >
            <span
              className="absolute rounded-full transition-transform"
              style={{
                top: 3,
                left: hideRomaji ? 19 : 3,
                width: 18,
                height: 18,
                background: '#fff',
              }}
            />
          </span>
        </label>
      </div>

      <div className="flex border-b border-white/10 px-4 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              opacity: activeTab === tab.id ? 1 : 0.5,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data === undefined && (
        <div className="flex items-center justify-center flex-1 opacity-40">Loading…</div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 opacity-60 text-sm text-center px-6">
          <p>Not in your current deck.</p>
          <p>
            Change scope in{' '}
            <Link to="/settings" style={{ color: 'var(--color-accent)' }}>
              Settings
            </Link>
            .
          </p>
        </div>
      ) : (
        <StudyGrid cards={tabCards} hideRomaji={hideRomaji} />
      )}
    </div>
  );
}

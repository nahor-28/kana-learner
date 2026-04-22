import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useDueCards } from '../hooks/useDueCards';

export function Home() {
  const navigate = useNavigate();
  const { dueCount, newCount, isLoading } = useDueCards();
  const settings = useLiveQuery(() => db.settings.get('singleton'));

  const canStart = dueCount > 0 || newCount > 0;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
          Kana SRS
        </h1>
        {settings?.userName && (
          <p className="opacity-60">Welcome back, {settings.userName}</p>
        )}
      </div>

      {isLoading ? (
        <p className="opacity-40">Loading…</p>
      ) : (
        <div
          className="flex flex-col items-center gap-2 p-6 rounded-2xl w-full max-w-xs text-center"
          style={{ background: 'var(--color-surface)' }}
        >
          {dueCount > 0 && <p className="text-2xl font-bold">{dueCount} due</p>}
          {newCount > 0 && (
            <p className="opacity-60">
              {dueCount === 0 ? `${newCount} new cards available` : `+ up to 7 new`}
            </p>
          )}
          {!canStart && (
            <p className="opacity-60">All caught up! Come back tomorrow.</p>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/session')}
          disabled={!canStart || isLoading}
          className="w-full py-4 rounded-xl text-xl font-bold transition-opacity disabled:opacity-30"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Start session
        </button>
        <button
          onClick={() => navigate('/study')}
          className="w-full py-3 rounded-xl text-base font-medium"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'var(--color-text)',
          }}
        >
          Study reference
        </button>
      </div>

      <div className="flex gap-6 text-sm opacity-50">
        <button onClick={() => navigate('/stats')}>Stats</button>
        <button onClick={() => navigate('/settings')}>Settings</button>
      </div>
    </div>
  );
}

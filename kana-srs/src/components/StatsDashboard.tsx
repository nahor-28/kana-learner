import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

const BOX_LABELS = ['New', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Mastered'];
const BOX_COLORS = ['#6b7280', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e'];

export function StatsDashboard() {
  const stats = useLiveQuery(async () => {
    const cards = await db.cards.toArray();
    const logs = await db.logs.toArray();

    const byBox = [0, 0, 0, 0, 0, 0];
    for (const c of cards) {
      byBox[c.box]++;
    }

    const totalReviews = logs.length;
    const correct = logs.filter(l => l.correct).length;
    const accuracy = totalReviews > 0 ? Math.round((correct / totalReviews) * 100) : 0;

    const leeches = cards.filter(c => c.isLeech);
    const settings = await db.settings.get('singleton');

    return { byBox, totalReviews, accuracy, leeches, settings, total: cards.length };
  });

  if (!stats) {
    return <div className="flex items-center justify-center flex-1 opacity-50">Loading…</div>;
  }

  const maxCount = Math.max(...stats.byBox, 1);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md mx-auto w-full">
      <h2 className="text-2xl font-bold">Stats</h2>

      {stats.settings && (
        <div className="flex gap-4">
          <StatChip label="Streak" value={`${stats.settings.streakCount}d`} />
          <StatChip label="Mastered" value={String(stats.byBox[5])} />
          <StatChip label="Accuracy" value={`${stats.accuracy}%`} />
        </div>
      )}

      <div>
        <p className="text-sm opacity-60 mb-3">Card distribution</p>
        <div className="flex flex-col gap-2">
          {stats.byBox.map((count, box) => (
            <div key={box} className="flex items-center gap-3">
              <span className="text-sm w-16 opacity-75">{BOX_LABELS[box]}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 12, background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background: BOX_COLORS[box],
                    minWidth: count > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="text-sm w-8 text-right opacity-75">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {stats.leeches.length > 0 && (
        <div>
          <p className="text-sm opacity-60 mb-2">Leeches ({stats.leeches.length})</p>
          <div className="flex flex-wrap gap-2">
            {stats.leeches.map(c => (
              <span
                key={c.id}
                className="px-2 py-1 rounded text-lg"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                title={c.romaji[0]}
              >
                {c.glyph}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm opacity-40">Total reviews: {stats.totalReviews}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center py-3 rounded-lg"
      style={{ background: 'var(--color-surface)' }}
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs opacity-60">{label}</span>
    </div>
  );
}

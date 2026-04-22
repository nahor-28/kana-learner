import type { Card } from '../data/kana';

interface Props {
  cards: Card[];
  hideRomaji: boolean;
}

export function StudyGrid({ cards, hideRomaji }: Props) {
  return (
    <div className="grid gap-3 p-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
      {cards.map(card => (
        <div
          key={card.id}
          className="flex flex-col items-center justify-center rounded-xl py-3 gap-1"
          style={{ background: 'var(--color-surface)' }}
        >
          <span style={{ fontSize: 36, lineHeight: 1 }}>{card.glyph}</span>
          <span
            className="text-xs font-medium transition-none"
            style={{ color: 'var(--color-text)', opacity: hideRomaji ? 0 : 0.7 }}
          >
            {card.romaji[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

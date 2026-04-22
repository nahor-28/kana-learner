import type { Card } from '../data/kana';

interface Props {
  card: Card;
  onGotIt: () => void;
}

export function NewCardIntro({ card, onGotIt }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 flex-1 px-6">
      <p className="text-sm opacity-60 uppercase tracking-wider">New card</p>
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: 160,
          height: 160,
          background: 'var(--color-surface)',
          fontSize: 96,
        }}
      >
        {card.glyph}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{card.romaji[0]}</p>
        {card.romaji.length > 1 && (
          <p className="text-sm opacity-60 mt-1">also: {card.romaji.slice(1).join(', ')}</p>
        )}
      </div>
      <button
        onClick={onGotIt}
        className="px-8 py-3 rounded-lg text-lg font-medium"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        Got it
      </button>
    </div>
  );
}

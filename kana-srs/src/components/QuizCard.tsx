import { useRef, useEffect, useState } from 'react';
import type { Card } from '../data/kana';
import { speak } from '../lib/speech';

interface Props {
  card: Card;
  phase: 'PROMPT' | 'REVEAL';
  lastCorrect: boolean | null;
  typedAnswer: string;
  onSubmit: (input: string) => void;
}

export function QuizCard({ card, phase, lastCorrect, typedAnswer, onSubmit }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'PROMPT') {
      setInput('');
      inputRef.current?.focus();
    }
  }, [phase, card.id]);

  useEffect(() => {
    if (phase === 'REVEAL') {
      speak(card.glyph);
    }
  }, [phase, card.glyph]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      onSubmit(input);
    }
  }

  const revealColor = lastCorrect ? '#22c55e' : '#ef4444';

  return (
    <div className="flex flex-col items-center justify-center gap-8 flex-1 px-6">
      <div
        className="flex items-center justify-center rounded-2xl transition-all"
        style={{
          width: 160,
          height: 160,
          background: 'var(--color-surface)',
          fontSize: phase === 'REVEAL' ? 64 : 96,
        }}
      >
        {card.glyph}
      </div>

      {phase === 'PROMPT' && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          placeholder="Type romaji, press Enter"
          className="w-full max-w-xs px-4 py-3 rounded-lg text-lg text-center outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--color-text)',
          }}
        />
      )}

      {phase === 'REVEAL' && (
        <div className="text-center">
          <p className="text-sm opacity-60 mb-1">You typed: {typedAnswer || '(empty)'}</p>
          <p className="text-2xl font-bold" style={{ color: revealColor }}>
            {card.romaji[0]}
          </p>
          {card.romaji.length > 1 && (
            <p className="text-sm opacity-60 mt-1">also: {card.romaji.slice(1).join(', ')}</p>
          )}
          <p className="mt-2 text-lg font-semibold" style={{ color: revealColor }}>
            {lastCorrect ? '✓ Correct' : '✗ Incorrect'}
          </p>
        </div>
      )}
    </div>
  );
}

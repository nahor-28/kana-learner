import { useState } from 'react';
import { db, DEFAULT_SETTINGS, seedCards } from '../data/db';
import type { DeckScope } from '../data/kana';

interface Props {
  onComplete: () => void;
}

const SCOPE_OPTIONS: { value: DeckScope; label: string; description: string }[] = [
  { value: 'hiragana-basic', label: 'Hiragana basic', description: '46 chars — あ–ん' },
  { value: 'katakana-basic', label: 'Katakana basic', description: '46 chars — ア–ン' },
  { value: 'hiragana-all', label: 'Hiragana all', description: 'base + dakuten/handakuten (~71 chars)' },
  { value: 'katakana-all', label: 'Katakana all', description: 'base + dakuten/handakuten (~71 chars)' },
  { value: 'both-all', label: 'Both — hiragana + katakana', description: 'All 142 characters' },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<DeckScope>('both-all');
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    if (!name.trim()) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    await db.settings.put({
      id: 'singleton',
      userName: name.trim(),
      deckScope: scope,
      ...DEFAULT_SETTINGS,
      lastStudyDate: today,
    });
    await seedCards(scope);
    onComplete();
  }

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-8 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
            Kana SRS
          </h1>
          <p className="text-lg opacity-75">Welcome! Let's get you started.</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-4">
          <label className="text-sm opacity-75">What's your name?</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-lg text-lg outline-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--color-text)',
            }}
            autoFocus
          />
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full py-3 rounded-lg text-lg font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Nice to meet you, {name}!</h1>
        <p className="opacity-75">What would you like to learn?</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3">
        {SCOPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setScope(opt.value)}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all"
            style={{
              background: scope === opt.value ? 'var(--color-accent)' : 'var(--color-surface)',
              border: `1px solid ${scope === opt.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              color: 'var(--color-text)',
            }}
          >
            <span className="text-xl">{scope === opt.value ? '●' : '○'}</span>
            <span>
              <span className="font-medium">{opt.label}</span>
              <span className="block text-sm opacity-75">{opt.description}</span>
            </span>
          </button>
        ))}
        <button
          onClick={handleStart}
          disabled={saving}
          className="mt-2 w-full py-3 rounded-lg text-lg font-medium transition-opacity disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          {saving ? 'Setting up…' : 'Start Learning →'}
        </button>
      </div>
    </div>
  );
}

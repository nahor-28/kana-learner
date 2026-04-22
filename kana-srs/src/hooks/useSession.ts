import { useState, useCallback } from 'react';
import { db } from '../data/db';
import { nextState } from '../srs/leitner';
import { matches } from '../lib/romaji';
import type { Card, ReviewLog } from '../data/kana';

export type SessionPhase =
  | 'LOADING'
  | 'PICK_NEXT'
  | 'INTRO_NEW'
  | 'PROMPT'
  | 'GRADE'
  | 'REVEAL'
  | 'SUMMARY';

export interface SessionResult {
  correct: number;
  total: number;
  leeches: Card[];
}

export interface SessionState {
  phase: SessionPhase;
  currentCard: Card | null;
  lastCorrect: boolean | null;
  typedAnswer: string;
  result: SessionResult;
  startSession: () => Promise<void>;
  submitAnswer: (input: string) => Promise<void>;
  advance: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function useSession(): SessionState {
  const [phase, setPhase] = useState<SessionPhase>('LOADING');
  const [, setQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [result, setResult] = useState<SessionResult>({ correct: 0, total: 0, leeches: [] });
  const [promptStartMs, setPromptStartMs] = useState(0);

  const startSession = useCallback(async () => {
    setPhase('LOADING');
    const now = Date.now();
    const settings = await db.settings.get('singleton');
    const threshold = settings?.reviewLoadThreshold ?? 15;
    const maxNew = settings?.newCardsPerDay ?? 7;

    const due = await db.cards
      .where('dueAt')
      .belowOrEqual(now)
      .filter(c => c.box >= 1)
      .toArray();

    let newCards: Card[] = [];
    if (due.length < threshold) {
      const budget = Math.min(maxNew, threshold - due.length);
      newCards = await db.cards
        .where('box')
        .equals(0)
        .limit(budget)
        .toArray();
    }

    const q = [...shuffle(due), ...shuffle(newCards)];
    setQueue(q);
    setResult({ correct: 0, total: 0, leeches: [] });

    if (q.length === 0) {
      setPhase('SUMMARY');
      return;
    }

    const first = q[0];
    setCurrentCard(first);
    setQueue(q.slice(1));
    setPhase(first.box === 0 ? 'INTRO_NEW' : 'PROMPT');
    setPromptStartMs(Date.now());
  }, []);

  const submitAnswer = useCallback(async (input: string) => {
    if (!currentCard || phase !== 'PROMPT') return;
    const now = Date.now();
    const correct = matches(currentCard, input);
    const responseMs = now - promptStartMs;

    setLastCorrect(correct);
    setTypedAnswer(input);

    const updated = nextState(currentCard, correct, now);
    await db.cards.put(updated);

    const log: ReviewLog = {
      cardId: currentCard.id,
      ts: now,
      correct,
      responseMs,
      typedAnswer: input,
    };
    await db.logs.add(log);

    setResult(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      leeches: updated.isLeech && !prev.leeches.find(c => c.id === updated.id)
        ? [...prev.leeches, updated]
        : prev.leeches,
    }));

    // Re-insert missed leech 2 positions ahead
    if (!correct && updated.isLeech) {
      setQueue(prev => {
        const insertAt = Math.min(2, prev.length);
        return [...prev.slice(0, insertAt), updated, ...prev.slice(insertAt)];
      });
    }

    setCurrentCard(updated);
    setPhase('REVEAL');
  }, [currentCard, phase, promptStartMs]);

  const advance = useCallback(() => {
    setQueue(prev => {
      const next = prev[0];
      const rest = prev.slice(1);

      if (!next) {
        setCurrentCard(null);
        setPhase('SUMMARY');
        return [];
      }

      setCurrentCard(next);
      const isNew = next.box === 0;
      setPhase(isNew ? 'INTRO_NEW' : 'PROMPT');
      setPromptStartMs(Date.now());
      setLastCorrect(null);
      setTypedAnswer('');
      return rest;
    });
  }, []);

  // Called from NewCardIntro "Got it" button
  const handleIntroComplete = useCallback(() => {
    setPhase('PROMPT');
    setPromptStartMs(Date.now());
  }, []);

  // Expose as advance when in INTRO_NEW state
  const advanceOrIntro = phase === 'INTRO_NEW' ? handleIntroComplete : advance;

  return {
    phase,
    currentCard,
    lastCorrect,
    typedAnswer,
    result,
    startSession,
    submitAnswer,
    advance: advanceOrIntro,
  };
}

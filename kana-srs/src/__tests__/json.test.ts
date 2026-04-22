import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SCHEMA_VERSION } from '../backup/json';
import type { Card, ReviewLog, Settings } from '../data/kana';

const sampleCard: Card = {
  id: 'hira-a',
  kind: 'hiragana',
  group: 'base',
  glyph: 'あ',
  romaji: ['a'],
  box: 2,
  dueAt: 1_700_000_000_000,
  lastSeenAt: 1_699_000_000_000,
  correctCount: 5,
  incorrectCount: 1,
  consecutiveMisses: 0,
  isLeech: false,
};

const sampleLog: ReviewLog = {
  id: 1,
  cardId: 'hira-a',
  ts: 1_699_000_000_000,
  correct: true,
  responseMs: 1234,
  typedAnswer: 'a',
};

const sampleSettings: Settings = {
  id: 'singleton',
  userName: 'Taro',
  deckScope: 'both-all',
  newCardsPerDay: 7,
  reviewLoadThreshold: 15,
  gistSync: { enabled: false },
  streakCount: 3,
  lastStudyDate: '2026-04-22',
};

describe('serialize / deserialize round-trip', () => {
  it('serialises and parses back to deep-equal data', () => {
    const json = serialize([sampleCard], [sampleLog], sampleSettings);
    const parsed = deserialize(json);
    expect(parsed.cards).toEqual([sampleCard]);
    expect(parsed.logs).toEqual([sampleLog]);
    expect(parsed.settings).toEqual(sampleSettings);
  });

  it('includes schemaVersion in export', () => {
    const json = serialize([sampleCard], [sampleLog], sampleSettings);
    const obj = JSON.parse(json) as { schemaVersion: number };
    expect(obj.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('includes exportedAt timestamp', () => {
    const before = Date.now();
    const json = serialize([sampleCard], [sampleLog], sampleSettings);
    const after = Date.now();
    const obj = JSON.parse(json) as { exportedAt: number };
    expect(obj.exportedAt).toBeGreaterThanOrEqual(before);
    expect(obj.exportedAt).toBeLessThanOrEqual(after);
  });

  it('round-trips multiple cards without loss', () => {
    const cards: Card[] = [
      sampleCard,
      { ...sampleCard, id: 'kata-a', kind: 'katakana', glyph: 'ア', box: 5 },
    ];
    const json = serialize(cards, [], sampleSettings);
    const parsed = deserialize(json);
    expect(parsed.cards).toHaveLength(2);
    expect(parsed.cards[1].box).toBe(5);
  });
});

describe('deserialize — schema version check', () => {
  it('throws on mismatched schemaVersion', () => {
    const obj = {
      schemaVersion: 999,
      exportedAt: Date.now(),
      cards: [],
      logs: [],
      settings: sampleSettings,
    };
    expect(() => deserialize(JSON.stringify(obj))).toThrow(/schema/i);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserialize('not json')).toThrow();
  });
});

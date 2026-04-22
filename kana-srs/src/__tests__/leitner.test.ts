import { describe, it, expect } from 'vitest';
import { nextState } from '../srs/leitner';
import type { Card } from '../data/kana';

const NOW = 1_000_000_000_000;
const DAY = 86_400_000;

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test-card',
    kind: 'hiragana',
    group: 'base',
    glyph: 'あ',
    romaji: ['a'],
    box: 1,
    dueAt: NOW,
    lastSeenAt: null,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveMisses: 0,
    isLeech: false,
    ...overrides,
  };
}

describe('nextState — correct answers', () => {
  it('promotes box 1 → 2', () => {
    const result = nextState(makeCard({ box: 1 }), true, NOW);
    expect(result.box).toBe(2);
  });

  it('promotes box 2 → 3', () => {
    const result = nextState(makeCard({ box: 2 }), true, NOW);
    expect(result.box).toBe(3);
  });

  it('promotes box 4 → 5', () => {
    const result = nextState(makeCard({ box: 4 }), true, NOW);
    expect(result.box).toBe(5);
  });

  it('caps at box 5 when already at 5', () => {
    const result = nextState(makeCard({ box: 5 }), true, NOW);
    expect(result.box).toBe(5);
  });

  it('sets dueAt to interval for new box', () => {
    // box 1 → 2, interval for box 2 is 2 days
    const result = nextState(makeCard({ box: 1 }), true, NOW);
    expect(result.dueAt).toBe(NOW + 2 * DAY);
  });

  it('sets dueAt to 16 days for box 5', () => {
    const result = nextState(makeCard({ box: 4 }), true, NOW);
    expect(result.dueAt).toBe(NOW + 16 * DAY);
  });

  it('resets consecutiveMisses to 0', () => {
    const result = nextState(makeCard({ consecutiveMisses: 2 }), true, NOW);
    expect(result.consecutiveMisses).toBe(0);
  });

  it('increments correctCount', () => {
    const result = nextState(makeCard({ correctCount: 3 }), true, NOW);
    expect(result.correctCount).toBe(4);
  });

  it('does not change incorrectCount', () => {
    const result = nextState(makeCard({ incorrectCount: 2 }), true, NOW);
    expect(result.incorrectCount).toBe(2);
  });

  it('sets lastSeenAt to now', () => {
    const result = nextState(makeCard(), true, NOW);
    expect(result.lastSeenAt).toBe(NOW);
  });
});

describe('nextState — incorrect answers', () => {
  it('resets box to 1 from box 3', () => {
    const result = nextState(makeCard({ box: 3 }), false, NOW);
    expect(result.box).toBe(1);
  });

  it('resets box to 1 from box 5', () => {
    const result = nextState(makeCard({ box: 5 }), false, NOW);
    expect(result.box).toBe(1);
  });

  it('sets dueAt to 1 day', () => {
    const result = nextState(makeCard(), false, NOW);
    expect(result.dueAt).toBe(NOW + 1 * DAY);
  });

  it('increments consecutiveMisses', () => {
    const result = nextState(makeCard({ consecutiveMisses: 1 }), false, NOW);
    expect(result.consecutiveMisses).toBe(2);
  });

  it('increments incorrectCount', () => {
    const result = nextState(makeCard({ incorrectCount: 4 }), false, NOW);
    expect(result.incorrectCount).toBe(5);
  });

  it('does not change correctCount', () => {
    const result = nextState(makeCard({ correctCount: 7 }), false, NOW);
    expect(result.correctCount).toBe(7);
  });
});

describe('nextState — leech detection', () => {
  it('sets isLeech when consecutiveMisses reaches 3', () => {
    const card = makeCard({ consecutiveMisses: 2, isLeech: false });
    const result = nextState(card, false, NOW);
    expect(result.isLeech).toBe(true);
  });

  it('does not set isLeech before threshold (miss 2)', () => {
    const card = makeCard({ consecutiveMisses: 1, isLeech: false });
    const result = nextState(card, false, NOW);
    expect(result.isLeech).toBe(false);
  });

  it('isLeech latches true even after a correct answer', () => {
    const card = makeCard({ consecutiveMisses: 0, isLeech: true });
    const result = nextState(card, true, NOW);
    expect(result.isLeech).toBe(true);
  });

  it('isLeech stays true on further misses', () => {
    const card = makeCard({ consecutiveMisses: 3, isLeech: true });
    const result = nextState(card, false, NOW);
    expect(result.isLeech).toBe(true);
  });
});

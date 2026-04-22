import { describe, it, expect } from 'vitest';
import { KANA_CARDS, filterCardsByScope } from '../data/kana';

describe('filterCardsByScope', () => {
  it('hiragana-basic returns exactly 48 cards (46 base + wi/we)', () => {
    const cards = filterCardsByScope('hiragana-basic');
    expect(cards.every(c => c.kind === 'hiragana')).toBe(true);
    expect(cards.every(c => c.group === 'base')).toBe(true);
    // hiragana base: a i u e o (5) + ka-ko (5) + sa row (5) + ta row (5) +
    // na row (5) + ha row (5) + ma row (5) + ya yu yo (3) + ra row (5) +
    // wa wi we wo (4) + n (1) = 48
    expect(cards.length).toBe(48);
  });

  it('katakana-basic returns exactly 48 cards', () => {
    const cards = filterCardsByScope('katakana-basic');
    expect(cards.every(c => c.kind === 'katakana')).toBe(true);
    expect(cards.every(c => c.group === 'base')).toBe(true);
    expect(cards.length).toBe(48);
  });

  it('hiragana-all returns only hiragana cards', () => {
    const cards = filterCardsByScope('hiragana-all');
    expect(cards.every(c => c.kind === 'hiragana')).toBe(true);
    expect(cards.length).toBeGreaterThan(48);
  });

  it('katakana-all returns only katakana cards', () => {
    const cards = filterCardsByScope('katakana-all');
    expect(cards.every(c => c.kind === 'katakana')).toBe(true);
    expect(cards.length).toBeGreaterThan(48);
  });

  it('both-all returns all cards', () => {
    const cards = filterCardsByScope('both-all');
    expect(cards.length).toBe(KANA_CARDS.length);
  });

  it('both-all includes both hiragana and katakana', () => {
    const cards = filterCardsByScope('both-all');
    expect(cards.some(c => c.kind === 'hiragana')).toBe(true);
    expect(cards.some(c => c.kind === 'katakana')).toBe(true);
  });

  it('hiragana-all includes dakuten cards', () => {
    const cards = filterCardsByScope('hiragana-all');
    expect(cards.some(c => c.group === 'dakuten')).toBe(true);
  });

  it('hiragana-all includes handakuten cards', () => {
    const cards = filterCardsByScope('hiragana-all');
    expect(cards.some(c => c.group === 'handakuten')).toBe(true);
  });

  it('hiragana-basic excludes dakuten and handakuten', () => {
    const cards = filterCardsByScope('hiragana-basic');
    expect(cards.every(c => c.group === 'base')).toBe(true);
  });

  it('all card ids in KANA_CARDS are unique', () => {
    const ids = KANA_CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all cards start with box 0', () => {
    expect(KANA_CARDS.every(c => c.box === 0)).toBe(true);
  });

  it('all cards start with null dueAt', () => {
    expect(KANA_CARDS.every(c => c.dueAt === null)).toBe(true);
  });
});

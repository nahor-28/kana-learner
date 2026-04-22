import { describe, it, expect } from 'vitest';
import { matches } from '../lib/romaji';
import type { Card } from '../data/kana';

function card(romaji: string[]): Card {
  return {
    id: 'x',
    kind: 'hiragana',
    group: 'base',
    glyph: '?',
    romaji,
    box: 0,
    dueAt: null,
    lastSeenAt: null,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveMisses: 0,
    isLeech: false,
  };
}

describe('matches — exact single romaji', () => {
  it('matches あ with a', () => {
    expect(matches(card(['a']), 'a')).toBe(true);
  });

  it('rejects あ with ka', () => {
    expect(matches(card(['a']), 'ka')).toBe(false);
  });
});

describe('matches — ambiguous characters (Hepburn / Nihon-shiki)', () => {
  it('accepts shi for し', () => {
    expect(matches(card(['shi', 'si']), 'shi')).toBe(true);
  });

  it('accepts si for し', () => {
    expect(matches(card(['shi', 'si']), 'si')).toBe(true);
  });

  it('rejects chi for し', () => {
    expect(matches(card(['shi', 'si']), 'chi')).toBe(false);
  });

  it('accepts tsu for つ', () => {
    expect(matches(card(['tsu', 'tu']), 'tsu')).toBe(true);
  });

  it('accepts tu for つ', () => {
    expect(matches(card(['tsu', 'tu']), 'tu')).toBe(true);
  });

  it('accepts chi for ち', () => {
    expect(matches(card(['chi', 'ti']), 'chi')).toBe(true);
  });

  it('accepts ti for ち', () => {
    expect(matches(card(['chi', 'ti']), 'ti')).toBe(true);
  });

  it('accepts fu for ふ', () => {
    expect(matches(card(['fu', 'hu']), 'fu')).toBe(true);
  });

  it('accepts hu for ふ', () => {
    expect(matches(card(['fu', 'hu']), 'hu')).toBe(true);
  });

  it('accepts ji for じ', () => {
    expect(matches(card(['ji', 'zi']), 'ji')).toBe(true);
  });

  it('accepts zi for じ', () => {
    expect(matches(card(['ji', 'zi']), 'zi')).toBe(true);
  });
});

describe('matches — case and whitespace', () => {
  it('is case-insensitive: SHI matches shi card', () => {
    expect(matches(card(['shi', 'si']), 'SHI')).toBe(true);
  });

  it('trims leading/trailing whitespace', () => {
    expect(matches(card(['shi', 'si']), '  shi  ')).toBe(true);
  });

  it('handles UPPERCASE single char', () => {
    expect(matches(card(['a']), 'A')).toBe(true);
  });
});

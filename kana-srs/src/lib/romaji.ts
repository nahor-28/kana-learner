import type { Card } from '../data/kana';

export function matches(card: Card, input: string): boolean {
  return card.romaji.includes(input.trim().toLowerCase());
}

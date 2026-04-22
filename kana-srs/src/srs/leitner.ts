import type { Card } from '../data/kana';

const INTERVALS_DAYS = [1, 2, 4, 8, 16] as const; // box 1..5
const LEECH_THRESHOLD = 3;

export function nextState(card: Card, correct: boolean, now: number): Card {
  if (correct) {
    const newBox = Math.min(5, card.box + 1) as Card['box'];
    return {
      ...card,
      box: newBox,
      dueAt: now + INTERVALS_DAYS[newBox - 1] * 86_400_000,
      lastSeenAt: now,
      correctCount: card.correctCount + 1,
      consecutiveMisses: 0,
    };
  } else {
    const consecutive = card.consecutiveMisses + 1;
    return {
      ...card,
      box: 1,
      dueAt: now + INTERVALS_DAYS[0] * 86_400_000,
      lastSeenAt: now,
      incorrectCount: card.incorrectCount + 1,
      consecutiveMisses: consecutive,
      isLeech: consecutive >= LEECH_THRESHOLD ? true : card.isLeech,
    };
  }
}

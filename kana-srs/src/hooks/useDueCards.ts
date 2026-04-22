import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export interface DueCardsState {
  dueCount: number;
  newCount: number;
  isLoading: boolean;
}

export function useDueCards(): DueCardsState {
  const now = Date.now();

  const result = useLiveQuery(async () => {
    const due = await db.cards
      .where('dueAt')
      .belowOrEqual(now)
      .filter(c => c.box >= 1)
      .count();
    const newCards = await db.cards.where('box').equals(0).count();
    return { dueCount: due, newCount: newCards };
  }, []);

  if (result === undefined) {
    return { dueCount: 0, newCount: 0, isLoading: true };
  }

  return { ...result, isLoading: false };
}

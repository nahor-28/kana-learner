import Dexie, { type Table } from 'dexie';
import { filterCardsByScope } from './kana';
import type { Card, ReviewLog, Settings, DeckScope } from './kana';

export type { Card, ReviewLog, Settings, DeckScope };

class KanaDB extends Dexie {
  cards!: Table<Card>;
  logs!: Table<ReviewLog>;
  settings!: Table<Settings>;

  constructor() {
    super('KanaSRS');
    this.version(1).stores({
      cards: 'id, box, dueAt, kind, group',
      logs: '++id, cardId, ts',
      settings: 'id',
    });
  }
}

export const db = new KanaDB();

export async function seedCards(scope: DeckScope): Promise<void> {
  const toSeed = filterCardsByScope(scope);
  const existingIds = new Set(await db.cards.toCollection().primaryKeys() as string[]);
  const newCards = toSeed.filter(c => !existingIds.has(c.id));
  if (newCards.length > 0) {
    await db.cards.bulkPut(newCards);
  }
}

export async function initDb(): Promise<void> {
  const settings = await db.settings.get('singleton');
  if (!settings) {
    return; // onboarding will seed after userName + scope are set
  }
  const count = await db.cards.count();
  if (count === 0) {
    await seedCards(settings.deckScope);
  }
}

export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'userName' | 'deckScope'> = {
  newCardsPerDay: 7,
  reviewLoadThreshold: 15,
  gistSync: { enabled: false },
  streakCount: 0,
  lastStudyDate: '',
};

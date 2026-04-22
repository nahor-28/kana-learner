export type CardKind = 'hiragana' | 'katakana';
export type CardGroup = 'base' | 'dakuten' | 'handakuten';

export interface Card {
  id: string;
  kind: CardKind;
  group: CardGroup;
  glyph: string;
  romaji: string[];
  box: 0 | 1 | 2 | 3 | 4 | 5;
  dueAt: number | null;
  lastSeenAt: number | null;
  correctCount: number;
  incorrectCount: number;
  consecutiveMisses: number;
  isLeech: boolean;
}

export interface ReviewLog {
  id?: number;
  cardId: string;
  ts: number;
  correct: boolean;
  responseMs: number;
  typedAnswer: string;
}

export type DeckScope =
  | 'hiragana-basic'
  | 'katakana-basic'
  | 'hiragana-all'
  | 'katakana-all'
  | 'both-all';

export interface Settings {
  id: 'singleton';
  userName: string;
  deckScope: DeckScope;
  newCardsPerDay: number;
  reviewLoadThreshold: number;
  gistSync: { enabled: boolean; token?: string; gistId?: string; lastSync?: number };
  streakCount: number;
  lastStudyDate: string;
}

function makeCard(
  id: string,
  kind: CardKind,
  group: CardGroup,
  glyph: string,
  romaji: string[],
): Card {
  return {
    id,
    kind,
    group,
    glyph,
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

const H = 'hiragana' as const;
const K = 'katakana' as const;
const BASE = 'base' as const;
const DAK = 'dakuten' as const;
const HAN = 'handakuten' as const;

export const KANA_CARDS: Card[] = [
  // ── Hiragana base ──────────────────────────────────────────────────────────
  makeCard('hira-a',   H, BASE, 'あ', ['a']),
  makeCard('hira-i',   H, BASE, 'い', ['i']),
  makeCard('hira-u',   H, BASE, 'う', ['u']),
  makeCard('hira-e',   H, BASE, 'え', ['e']),
  makeCard('hira-o',   H, BASE, 'お', ['o']),
  makeCard('hira-ka',  H, BASE, 'か', ['ka']),
  makeCard('hira-ki',  H, BASE, 'き', ['ki']),
  makeCard('hira-ku',  H, BASE, 'く', ['ku']),
  makeCard('hira-ke',  H, BASE, 'け', ['ke']),
  makeCard('hira-ko',  H, BASE, 'こ', ['ko']),
  makeCard('hira-sa',  H, BASE, 'さ', ['sa']),
  makeCard('hira-shi', H, BASE, 'し', ['shi', 'si']),
  makeCard('hira-su',  H, BASE, 'す', ['su']),
  makeCard('hira-se',  H, BASE, 'せ', ['se']),
  makeCard('hira-so',  H, BASE, 'そ', ['so']),
  makeCard('hira-ta',  H, BASE, 'た', ['ta']),
  makeCard('hira-chi', H, BASE, 'ち', ['chi', 'ti']),
  makeCard('hira-tsu', H, BASE, 'つ', ['tsu', 'tu']),
  makeCard('hira-te',  H, BASE, 'て', ['te']),
  makeCard('hira-to',  H, BASE, 'と', ['to']),
  makeCard('hira-na',  H, BASE, 'な', ['na']),
  makeCard('hira-ni',  H, BASE, 'に', ['ni']),
  makeCard('hira-nu',  H, BASE, 'ぬ', ['nu']),
  makeCard('hira-ne',  H, BASE, 'ね', ['ne']),
  makeCard('hira-no',  H, BASE, 'の', ['no']),
  makeCard('hira-ha',  H, BASE, 'は', ['ha']),
  makeCard('hira-hi',  H, BASE, 'ひ', ['hi']),
  makeCard('hira-fu',  H, BASE, 'ふ', ['fu', 'hu']),
  makeCard('hira-he',  H, BASE, 'へ', ['he']),
  makeCard('hira-ho',  H, BASE, 'ほ', ['ho']),
  makeCard('hira-ma',  H, BASE, 'ま', ['ma']),
  makeCard('hira-mi',  H, BASE, 'み', ['mi']),
  makeCard('hira-mu',  H, BASE, 'む', ['mu']),
  makeCard('hira-me',  H, BASE, 'め', ['me']),
  makeCard('hira-mo',  H, BASE, 'も', ['mo']),
  makeCard('hira-ya',  H, BASE, 'や', ['ya']),
  makeCard('hira-yu',  H, BASE, 'ゆ', ['yu']),
  makeCard('hira-yo',  H, BASE, 'よ', ['yo']),
  makeCard('hira-ra',  H, BASE, 'ら', ['ra']),
  makeCard('hira-ri',  H, BASE, 'り', ['ri']),
  makeCard('hira-ru',  H, BASE, 'る', ['ru']),
  makeCard('hira-re',  H, BASE, 'れ', ['re']),
  makeCard('hira-ro',  H, BASE, 'ろ', ['ro']),
  makeCard('hira-wa',  H, BASE, 'わ', ['wa']),
  makeCard('hira-wi',  H, BASE, 'ゐ', ['wi']),
  makeCard('hira-we',  H, BASE, 'ゑ', ['we']),
  makeCard('hira-wo',  H, BASE, 'を', ['wo']),
  makeCard('hira-n',   H, BASE, 'ん', ['n', 'nn']),

  // ── Hiragana dakuten ───────────────────────────────────────────────────────
  makeCard('hira-ga',  H, DAK, 'が', ['ga']),
  makeCard('hira-gi',  H, DAK, 'ぎ', ['gi']),
  makeCard('hira-gu',  H, DAK, 'ぐ', ['gu']),
  makeCard('hira-ge',  H, DAK, 'げ', ['ge']),
  makeCard('hira-go',  H, DAK, 'ご', ['go']),
  makeCard('hira-za',  H, DAK, 'ざ', ['za']),
  makeCard('hira-ji',  H, DAK, 'じ', ['ji', 'zi']),
  makeCard('hira-zu',  H, DAK, 'ず', ['zu']),
  makeCard('hira-ze',  H, DAK, 'ぜ', ['ze']),
  makeCard('hira-zo',  H, DAK, 'ぞ', ['zo']),
  makeCard('hira-da',  H, DAK, 'だ', ['da']),
  makeCard('hira-di',  H, DAK, 'ぢ', ['di', 'ji']),
  makeCard('hira-du',  H, DAK, 'づ', ['du', 'zu']),
  makeCard('hira-de',  H, DAK, 'で', ['de']),
  makeCard('hira-do',  H, DAK, 'ど', ['do']),
  makeCard('hira-ba',  H, DAK, 'ば', ['ba']),
  makeCard('hira-bi',  H, DAK, 'び', ['bi']),
  makeCard('hira-bu',  H, DAK, 'ぶ', ['bu']),
  makeCard('hira-be',  H, DAK, 'べ', ['be']),
  makeCard('hira-bo',  H, DAK, 'ぼ', ['bo']),

  // ── Hiragana handakuten ────────────────────────────────────────────────────
  makeCard('hira-pa',  H, HAN, 'ぱ', ['pa']),
  makeCard('hira-pi',  H, HAN, 'ぴ', ['pi']),
  makeCard('hira-pu',  H, HAN, 'ぷ', ['pu']),
  makeCard('hira-pe',  H, HAN, 'ぺ', ['pe']),
  makeCard('hira-po',  H, HAN, 'ぽ', ['po']),

  // ── Katakana base ──────────────────────────────────────────────────────────
  makeCard('kata-a',   K, BASE, 'ア', ['a']),
  makeCard('kata-i',   K, BASE, 'イ', ['i']),
  makeCard('kata-u',   K, BASE, 'ウ', ['u']),
  makeCard('kata-e',   K, BASE, 'エ', ['e']),
  makeCard('kata-o',   K, BASE, 'オ', ['o']),
  makeCard('kata-ka',  K, BASE, 'カ', ['ka']),
  makeCard('kata-ki',  K, BASE, 'キ', ['ki']),
  makeCard('kata-ku',  K, BASE, 'ク', ['ku']),
  makeCard('kata-ke',  K, BASE, 'ケ', ['ke']),
  makeCard('kata-ko',  K, BASE, 'コ', ['ko']),
  makeCard('kata-sa',  K, BASE, 'サ', ['sa']),
  makeCard('kata-shi', K, BASE, 'シ', ['shi', 'si']),
  makeCard('kata-su',  K, BASE, 'ス', ['su']),
  makeCard('kata-se',  K, BASE, 'セ', ['se']),
  makeCard('kata-so',  K, BASE, 'ソ', ['so']),
  makeCard('kata-ta',  K, BASE, 'タ', ['ta']),
  makeCard('kata-chi', K, BASE, 'チ', ['chi', 'ti']),
  makeCard('kata-tsu', K, BASE, 'ツ', ['tsu', 'tu']),
  makeCard('kata-te',  K, BASE, 'テ', ['te']),
  makeCard('kata-to',  K, BASE, 'ト', ['to']),
  makeCard('kata-na',  K, BASE, 'ナ', ['na']),
  makeCard('kata-ni',  K, BASE, 'ニ', ['ni']),
  makeCard('kata-nu',  K, BASE, 'ヌ', ['nu']),
  makeCard('kata-ne',  K, BASE, 'ネ', ['ne']),
  makeCard('kata-no',  K, BASE, 'ノ', ['no']),
  makeCard('kata-ha',  K, BASE, 'ハ', ['ha']),
  makeCard('kata-hi',  K, BASE, 'ヒ', ['hi']),
  makeCard('kata-fu',  K, BASE, 'フ', ['fu', 'hu']),
  makeCard('kata-he',  K, BASE, 'ヘ', ['he']),
  makeCard('kata-ho',  K, BASE, 'ホ', ['ho']),
  makeCard('kata-ma',  K, BASE, 'マ', ['ma']),
  makeCard('kata-mi',  K, BASE, 'ミ', ['mi']),
  makeCard('kata-mu',  K, BASE, 'ム', ['mu']),
  makeCard('kata-me',  K, BASE, 'メ', ['me']),
  makeCard('kata-mo',  K, BASE, 'モ', ['mo']),
  makeCard('kata-ya',  K, BASE, 'ヤ', ['ya']),
  makeCard('kata-yu',  K, BASE, 'ユ', ['yu']),
  makeCard('kata-yo',  K, BASE, 'ヨ', ['yo']),
  makeCard('kata-ra',  K, BASE, 'ラ', ['ra']),
  makeCard('kata-ri',  K, BASE, 'リ', ['ri']),
  makeCard('kata-ru',  K, BASE, 'ル', ['ru']),
  makeCard('kata-re',  K, BASE, 'レ', ['re']),
  makeCard('kata-ro',  K, BASE, 'ロ', ['ro']),
  makeCard('kata-wa',  K, BASE, 'ワ', ['wa']),
  makeCard('kata-wi',  K, BASE, 'ヰ', ['wi']),
  makeCard('kata-we',  K, BASE, 'ヱ', ['we']),
  makeCard('kata-wo',  K, BASE, 'ヲ', ['wo']),
  makeCard('kata-n',   K, BASE, 'ン', ['n', 'nn']),

  // ── Katakana dakuten ───────────────────────────────────────────────────────
  makeCard('kata-ga',  K, DAK, 'ガ', ['ga']),
  makeCard('kata-gi',  K, DAK, 'ギ', ['gi']),
  makeCard('kata-gu',  K, DAK, 'グ', ['gu']),
  makeCard('kata-ge',  K, DAK, 'ゲ', ['ge']),
  makeCard('kata-go',  K, DAK, 'ゴ', ['go']),
  makeCard('kata-za',  K, DAK, 'ザ', ['za']),
  makeCard('kata-ji',  K, DAK, 'ジ', ['ji', 'zi']),
  makeCard('kata-zu',  K, DAK, 'ズ', ['zu']),
  makeCard('kata-ze',  K, DAK, 'ゼ', ['ze']),
  makeCard('kata-zo',  K, DAK, 'ゾ', ['zo']),
  makeCard('kata-da',  K, DAK, 'ダ', ['da']),
  makeCard('kata-di',  K, DAK, 'ヂ', ['di', 'ji']),
  makeCard('kata-du',  K, DAK, 'ヅ', ['du', 'zu']),
  makeCard('kata-de',  K, DAK, 'デ', ['de']),
  makeCard('kata-do',  K, DAK, 'ド', ['do']),
  makeCard('kata-ba',  K, DAK, 'バ', ['ba']),
  makeCard('kata-bi',  K, DAK, 'ビ', ['bi']),
  makeCard('kata-bu',  K, DAK, 'ブ', ['bu']),
  makeCard('kata-be',  K, DAK, 'ベ', ['be']),
  makeCard('kata-bo',  K, DAK, 'ボ', ['bo']),

  // ── Katakana handakuten ────────────────────────────────────────────────────
  makeCard('kata-pa',  K, HAN, 'パ', ['pa']),
  makeCard('kata-pi',  K, HAN, 'ピ', ['pi']),
  makeCard('kata-pu',  K, HAN, 'プ', ['pu']),
  makeCard('kata-pe',  K, HAN, 'ペ', ['pe']),
  makeCard('kata-po',  K, HAN, 'ポ', ['po']),
];

export function filterCardsByScope(scope: DeckScope): Card[] {
  switch (scope) {
    case 'hiragana-basic':
      return KANA_CARDS.filter(c => c.kind === 'hiragana' && c.group === 'base');
    case 'katakana-basic':
      return KANA_CARDS.filter(c => c.kind === 'katakana' && c.group === 'base');
    case 'hiragana-all':
      return KANA_CARDS.filter(c => c.kind === 'hiragana');
    case 'katakana-all':
      return KANA_CARDS.filter(c => c.kind === 'katakana');
    case 'both-all':
      return KANA_CARDS;
  }
}

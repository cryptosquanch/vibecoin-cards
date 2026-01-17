'use client';

import type { Token } from './mock-data';
import { getSuitForCategory, getRankFromScore } from '@/components/design-system';

// Poker hand types in order of strength
export type HandType =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card'
  | 'no-hand';

export interface HandResult {
  type: HandType;
  name: string;
  description: string;
  feeDiscount: number; // Percentage discount (0-50)
  cards: TokenCard[]; // The cards that form the hand
  strength: number; // 0-100 for comparison
}

export interface TokenCard {
  token: Token;
  rank: string;
  rankValue: number;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  category: string;
}

// Hand configurations with rewards
export const HAND_CONFIG: Record<HandType, { name: string; description: string; feeDiscount: number; strength: number }> = {
  'royal-flush': {
    name: 'Royal Flush',
    description: '5 tokens, same category, A-K-Q-J-10',
    feeDiscount: 50,
    strength: 100,
  },
  'straight-flush': {
    name: 'Straight Flush',
    description: '5 sequential ranks, same category',
    feeDiscount: 40,
    strength: 90,
  },
  'four-of-a-kind': {
    name: 'Four of a Kind',
    description: '4 tokens with same rank',
    feeDiscount: 35,
    strength: 80,
  },
  'full-house': {
    name: 'Full House',
    description: '3 of one rank + 2 of another',
    feeDiscount: 25,
    strength: 70,
  },
  'flush': {
    name: 'Flush',
    description: '5 tokens, same category',
    feeDiscount: 20,
    strength: 60,
  },
  'straight': {
    name: 'Straight',
    description: '5 sequential ranks',
    feeDiscount: 15,
    strength: 50,
  },
  'three-of-a-kind': {
    name: 'Three of a Kind',
    description: '3 tokens with same rank',
    feeDiscount: 10,
    strength: 40,
  },
  'two-pair': {
    name: 'Two Pair',
    description: '2 different pairs',
    feeDiscount: 7,
    strength: 30,
  },
  'pair': {
    name: 'Pair',
    description: '2 tokens with same rank',
    feeDiscount: 5,
    strength: 20,
  },
  'high-card': {
    name: 'High Card',
    description: 'Your highest ranked card',
    feeDiscount: 2,
    strength: 10,
  },
  'no-hand': {
    name: 'No Hand',
    description: 'Hold tokens to form a hand',
    feeDiscount: 0,
    strength: 0,
  },
};

// Convert rank string to numeric value for comparison
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Convert tokens to card format
export function tokensToCards(tokens: Token[]): TokenCard[] {
  return tokens.map((token) => {
    const suit = getSuitForCategory(token.category);
    const rank = getRankFromScore(token.score);
    return {
      token,
      rank,
      rankValue: RANK_VALUES[rank] || 2,
      suit,
      category: token.category,
    };
  });
}

// Check for flush (5 same suit/category)
function checkFlush(cards: TokenCard[]): TokenCard[] | null {
  const suitCounts = new Map<string, TokenCard[]>();

  for (const card of cards) {
    const existing = suitCounts.get(card.suit) || [];
    existing.push(card);
    suitCounts.set(card.suit, existing);
  }

  for (const [, suitCards] of suitCounts) {
    if (suitCards.length >= 5) {
      return suitCards.slice(0, 5).sort((a, b) => b.rankValue - a.rankValue);
    }
  }

  return null;
}

// Check for straight (5 sequential)
function checkStraight(cards: TokenCard[]): TokenCard[] | null {
  const uniqueRanks = [...new Map(cards.map(c => [c.rankValue, c])).values()]
    .sort((a, b) => b.rankValue - a.rankValue);

  if (uniqueRanks.length < 5) return null;

  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const sequence = uniqueRanks.slice(i, i + 5);
    const isSequential = sequence.every((card, idx) => {
      if (idx === 0) return true;
      return sequence[idx - 1].rankValue - card.rankValue === 1;
    });

    if (isSequential) return sequence;
  }

  // Check for A-2-3-4-5 (wheel)
  const hasAce = uniqueRanks.some(c => c.rankValue === 14);
  const lowCards = uniqueRanks.filter(c => c.rankValue <= 5);
  if (hasAce && lowCards.length >= 4) {
    const wheel = [2, 3, 4, 5].every(v => lowCards.some(c => c.rankValue === v));
    if (wheel) {
      const ace = uniqueRanks.find(c => c.rankValue === 14)!;
      return [...lowCards.filter(c => c.rankValue <= 5).slice(0, 4), ace];
    }
  }

  return null;
}

// Check for n-of-a-kind
function checkOfAKind(cards: TokenCard[], n: number): TokenCard[] | null {
  const rankCounts = new Map<number, TokenCard[]>();

  for (const card of cards) {
    const existing = rankCounts.get(card.rankValue) || [];
    existing.push(card);
    rankCounts.set(card.rankValue, existing);
  }

  const matches = [...rankCounts.entries()]
    .filter(([, c]) => c.length >= n)
    .sort((a, b) => b[0] - a[0]);

  if (matches.length > 0) {
    return matches[0][1].slice(0, n);
  }

  return null;
}

// Check for pairs
function checkPairs(cards: TokenCard[]): { pairs: TokenCard[][]; remaining: TokenCard[] } {
  const rankCounts = new Map<number, TokenCard[]>();

  for (const card of cards) {
    const existing = rankCounts.get(card.rankValue) || [];
    existing.push(card);
    rankCounts.set(card.rankValue, existing);
  }

  const pairs: TokenCard[][] = [];
  const remaining: TokenCard[] = [];

  const sorted = [...rankCounts.entries()].sort((a, b) => b[0] - a[0]);

  for (const [, rankCards] of sorted) {
    if (rankCards.length >= 2) {
      pairs.push(rankCards.slice(0, 2));
      if (rankCards.length > 2) {
        remaining.push(...rankCards.slice(2));
      }
    } else {
      remaining.push(...rankCards);
    }
  }

  return { pairs, remaining };
}

// Main hand evaluation function
export function evaluateHand(tokens: Token[]): HandResult {
  if (tokens.length === 0) {
    return {
      type: 'no-hand',
      ...HAND_CONFIG['no-hand'],
      cards: [],
    };
  }

  const cards = tokensToCards(tokens);

  // Check for Royal Flush (A-K-Q-J-10 same suit)
  const flushCards = checkFlush(cards);
  if (flushCards) {
    const royalRanks = [14, 13, 12, 11, 10];
    const isRoyal = royalRanks.every(r => flushCards.some(c => c.rankValue === r));
    if (isRoyal) {
      return {
        type: 'royal-flush',
        ...HAND_CONFIG['royal-flush'],
        cards: flushCards,
      };
    }

    // Check for Straight Flush
    const straightFlush = checkStraight(flushCards);
    if (straightFlush) {
      return {
        type: 'straight-flush',
        ...HAND_CONFIG['straight-flush'],
        cards: straightFlush,
      };
    }
  }

  // Check for Four of a Kind
  const fourKind = checkOfAKind(cards, 4);
  if (fourKind) {
    const kicker = cards.find(c => !fourKind.includes(c));
    return {
      type: 'four-of-a-kind',
      ...HAND_CONFIG['four-of-a-kind'],
      cards: kicker ? [...fourKind, kicker] : fourKind,
    };
  }

  // Check for Full House
  const threeKind = checkOfAKind(cards, 3);
  if (threeKind) {
    const remainingCards = cards.filter(c => !threeKind.includes(c));
    const pair = checkOfAKind(remainingCards, 2);
    if (pair) {
      return {
        type: 'full-house',
        ...HAND_CONFIG['full-house'],
        cards: [...threeKind, ...pair],
      };
    }
  }

  // Check for Flush
  if (flushCards) {
    return {
      type: 'flush',
      ...HAND_CONFIG['flush'],
      cards: flushCards,
    };
  }

  // Check for Straight
  const straight = checkStraight(cards);
  if (straight) {
    return {
      type: 'straight',
      ...HAND_CONFIG['straight'],
      cards: straight,
    };
  }

  // Check for Three of a Kind
  if (threeKind) {
    const kickers = cards
      .filter(c => !threeKind.includes(c))
      .sort((a, b) => b.rankValue - a.rankValue)
      .slice(0, 2);
    return {
      type: 'three-of-a-kind',
      ...HAND_CONFIG['three-of-a-kind'],
      cards: [...threeKind, ...kickers],
    };
  }

  // Check for Two Pair / Pair
  const { pairs, remaining } = checkPairs(cards);

  if (pairs.length >= 2) {
    const topPairs = pairs.slice(0, 2).flat();
    const kicker = remaining.sort((a, b) => b.rankValue - a.rankValue)[0];
    return {
      type: 'two-pair',
      ...HAND_CONFIG['two-pair'],
      cards: kicker ? [...topPairs, kicker] : topPairs,
    };
  }

  if (pairs.length === 1) {
    const kickers = remaining
      .sort((a, b) => b.rankValue - a.rankValue)
      .slice(0, 3);
    return {
      type: 'pair',
      ...HAND_CONFIG['pair'],
      cards: [...pairs[0], ...kickers],
    };
  }

  // High Card
  const highCards = cards.sort((a, b) => b.rankValue - a.rankValue).slice(0, 5);
  return {
    type: 'high-card',
    ...HAND_CONFIG['high-card'],
    cards: highCards,
  };
}

// Get hand bonus discount for fee calculation
export function getHandBonus(tokens: Token[]): { discount: number; hand: HandResult } {
  const hand = evaluateHand(tokens);
  return {
    discount: hand.feeDiscount,
    hand,
  };
}

// Format hand for display
export function formatHandName(type: HandType): string {
  return HAND_CONFIG[type].name;
}

// Get color for hand strength
export function getHandColor(type: HandType): string {
  const strength = HAND_CONFIG[type].strength;
  if (strength >= 90) return 'text-yellow-500'; // Gold for royal/straight flush
  if (strength >= 70) return 'text-purple-500'; // Purple for 4-kind/full house
  if (strength >= 50) return 'text-blue-500';   // Blue for flush/straight
  if (strength >= 30) return 'text-green-500';  // Green for 3-kind/two-pair
  if (strength >= 10) return 'text-botanical-600'; // Botanical for pair/high
  return 'text-muted';
}

// Get emoji for hand type
export function getHandEmoji(type: HandType): string {
  switch (type) {
    case 'royal-flush': return '👑';
    case 'straight-flush': return '🌟';
    case 'four-of-a-kind': return '🎯';
    case 'full-house': return '🏠';
    case 'flush': return '💎';
    case 'straight': return '📈';
    case 'three-of-a-kind': return '🎲';
    case 'two-pair': return '✌️';
    case 'pair': return '🃏';
    case 'high-card': return '⬆️';
    case 'no-hand': return '📭';
  }
}

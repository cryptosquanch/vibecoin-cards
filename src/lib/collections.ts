/**
 * Collection Mechanics System
 *
 * Features:
 * 1. Deck Completion - Own tokens from all categories for bonuses
 * 2. Card Backs - Unlock custom backs through achievements
 * 3. Collection Sets - Themed sets with completion rewards
 * 4. Rarity System - Cards have rarity based on holders/supply
 * 5. Collection Score - Overall collection rating
 */

import type { Token, Holding } from './mock-data';

// Card back types
export type CardBackType =
  | 'default'
  | 'botanical'
  | 'gold'
  | 'holographic'
  | 'diamond'
  | 'fire'
  | 'ice'
  | 'cosmic'
  | 'legendary'
  | 'custom';

export interface CardBack {
  id: CardBackType;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockRequirement: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  preview: {
    primaryColor: string;
    secondaryColor: string;
    pattern: 'solid' | 'gradient' | 'pattern' | 'animated';
  };
}

// Card back configurations
export const CARD_BACKS: Record<CardBackType, Omit<CardBack, 'isUnlocked' | 'unlockedAt'>> = {
  default: {
    id: 'default',
    name: 'Classic',
    description: 'The original card back design',
    rarity: 'common',
    unlockRequirement: 'Default',
    preview: {
      primaryColor: '#2D5A3D',
      secondaryColor: '#1a3d28',
      pattern: 'pattern',
    },
  },
  botanical: {
    id: 'botanical',
    name: 'Botanical',
    description: 'Nature-inspired botanical pattern',
    rarity: 'common',
    unlockRequirement: 'Own 5 tokens',
    preview: {
      primaryColor: '#4A7C59',
      secondaryColor: '#2D5A3D',
      pattern: 'pattern',
    },
  },
  gold: {
    id: 'gold',
    name: 'Golden',
    description: 'Luxurious gold foil design',
    rarity: 'rare',
    unlockRequirement: 'Portfolio value $10,000+',
    preview: {
      primaryColor: '#FFD700',
      secondaryColor: '#B8860B',
      pattern: 'gradient',
    },
  },
  holographic: {
    id: 'holographic',
    name: 'Holographic',
    description: 'Shifting rainbow holographic effect',
    rarity: 'epic',
    unlockRequirement: 'Complete any collection set',
    preview: {
      primaryColor: '#FF69B4',
      secondaryColor: '#00CED1',
      pattern: 'animated',
    },
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    description: 'Crystal clear diamond pattern',
    rarity: 'epic',
    unlockRequirement: 'Hold for 60+ days total',
    preview: {
      primaryColor: '#B9F2FF',
      secondaryColor: '#87CEEB',
      pattern: 'pattern',
    },
  },
  fire: {
    id: 'fire',
    name: 'Inferno',
    description: 'Blazing fire animation',
    rarity: 'epic',
    unlockRequirement: 'Achieve 10x on any token',
    preview: {
      primaryColor: '#FF4500',
      secondaryColor: '#FF8C00',
      pattern: 'animated',
    },
  },
  ice: {
    id: 'ice',
    name: 'Frozen',
    description: 'Icy crystalline design',
    rarity: 'rare',
    unlockRequirement: 'Survive 3 token dumps (-50%+)',
    preview: {
      primaryColor: '#00BFFF',
      secondaryColor: '#E0FFFF',
      pattern: 'pattern',
    },
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Deep space nebula design',
    rarity: 'legendary',
    unlockRequirement: 'Own 1 token from every category',
    preview: {
      primaryColor: '#9400D3',
      secondaryColor: '#000080',
      pattern: 'animated',
    },
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    description: 'The rarest card back - animated gold & purple',
    rarity: 'legendary',
    unlockRequirement: 'Achieve 100x on any token',
    preview: {
      primaryColor: '#FFD700',
      secondaryColor: '#9400D3',
      pattern: 'animated',
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Design your own card back',
    rarity: 'legendary',
    unlockRequirement: 'Complete all collection sets',
    preview: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#000000',
      pattern: 'solid',
    },
  },
};

// Collection set types
export type SetType =
  | 'defi-royalty'
  | 'meme-lords'
  | 'ai-pioneers'
  | 'gaming-legends'
  | 'full-deck'
  | 'suit-master'
  | 'high-rollers'
  | 'diamond-collection';

export interface CollectionSet {
  id: SetType;
  name: string;
  description: string;
  icon: string;
  requirements: SetRequirement[];
  rewards: SetReward[];
  progress: number; // 0-100
  isComplete: boolean;
  completedAt?: string;
}

export interface SetRequirement {
  type: 'category' | 'rank' | 'suit' | 'specific-token' | 'min-value' | 'min-count';
  value: string | number;
  label: string;
  isMet: boolean;
}

export interface SetReward {
  type: 'card-back' | 'fee-discount' | 'airdrop-boost' | 'title' | 'badge';
  value: string | number;
  label: string;
  icon: string;
}

// Collection set configurations
export const COLLECTION_SETS: Record<SetType, Omit<CollectionSet, 'progress' | 'isComplete' | 'completedAt'>> = {
  'defi-royalty': {
    id: 'defi-royalty',
    name: 'DeFi Royalty',
    description: 'Collect all face cards (J, Q, K, A) from DeFi category',
    icon: '👑',
    requirements: [
      { type: 'category', value: 'DeFi', label: 'DeFi tokens', isMet: false },
      { type: 'rank', value: 'J', label: 'Jack (J)', isMet: false },
      { type: 'rank', value: 'Q', label: 'Queen (Q)', isMet: false },
      { type: 'rank', value: 'K', label: 'King (K)', isMet: false },
      { type: 'rank', value: 'A', label: 'Ace (A)', isMet: false },
    ],
    rewards: [
      { type: 'fee-discount', value: 10, label: '10% fee discount on DeFi trades', icon: '💰' },
      { type: 'title', value: 'DeFi King', label: '"DeFi King" title', icon: '👑' },
    ],
  },
  'meme-lords': {
    id: 'meme-lords',
    name: 'Creator Kings',
    description: 'Own 5 different Creator tokens',
    icon: '🎨',
    requirements: [
      { type: 'category', value: 'Creator', label: '5 Creator tokens', isMet: false },
      { type: 'min-count', value: 5, label: 'Minimum 5 tokens', isMet: false },
    ],
    rewards: [
      { type: 'card-back', value: 'holographic', label: 'Holographic card back', icon: '🌈' },
      { type: 'airdrop-boost', value: 25, label: '25% airdrop boost', icon: '🪂' },
    ],
  },
  'ai-pioneers': {
    id: 'ai-pioneers',
    name: 'AI Pioneers',
    description: 'Collect 3 AI category tokens with score 80+',
    icon: '🤖',
    requirements: [
      { type: 'category', value: 'AI', label: 'AI tokens', isMet: false },
      { type: 'min-count', value: 3, label: 'Minimum 3 tokens', isMet: false },
      { type: 'rank', value: '80+', label: 'Score 80+ (J or higher)', isMet: false },
    ],
    rewards: [
      { type: 'fee-discount', value: 15, label: '15% fee discount on AI trades', icon: '💰' },
      { type: 'badge', value: 'ai-pioneer', label: '"AI Pioneer" badge', icon: '🤖' },
    ],
  },
  'gaming-legends': {
    id: 'gaming-legends',
    name: 'Gaming Legends',
    description: 'Own gaming tokens worth $5,000+ total',
    icon: '🎮',
    requirements: [
      { type: 'category', value: 'Gaming', label: 'Gaming tokens', isMet: false },
      { type: 'min-value', value: 5000, label: '$5,000+ total value', isMet: false },
    ],
    rewards: [
      { type: 'card-back', value: 'fire', label: 'Inferno card back', icon: '🔥' },
      { type: 'title', value: 'Gaming Legend', label: '"Gaming Legend" title', icon: '🎮' },
    ],
  },
  'full-deck': {
    id: 'full-deck',
    name: 'Full Deck',
    description: 'Own at least 1 token from every category',
    icon: '🃏',
    requirements: [
      { type: 'category', value: 'DeFi', label: 'DeFi', isMet: false },
      { type: 'category', value: 'AI', label: 'AI', isMet: false },
      { type: 'category', value: 'Gaming', label: 'Gaming', isMet: false },
      { type: 'category', value: 'Creator', label: 'Creator', isMet: false },
    ],
    rewards: [
      { type: 'card-back', value: 'cosmic', label: 'Cosmic card back', icon: '🌌' },
      { type: 'fee-discount', value: 20, label: '20% fee discount (all trades)', icon: '💰' },
      { type: 'title', value: 'Deck Master', label: '"Deck Master" title', icon: '🃏' },
    ],
  },
  'suit-master': {
    id: 'suit-master',
    name: 'Suit Master',
    description: 'Own 5 tokens of the same suit (category)',
    icon: '♠️',
    requirements: [
      { type: 'suit', value: 'any', label: '5 tokens, same category', isMet: false },
    ],
    rewards: [
      { type: 'fee-discount', value: 5, label: '5% fee discount on that category', icon: '💰' },
      { type: 'badge', value: 'suit-master', label: '"Suit Master" badge', icon: '♠️' },
    ],
  },
  'high-rollers': {
    id: 'high-rollers',
    name: 'High Rollers',
    description: 'Portfolio value exceeds $50,000',
    icon: '🎰',
    requirements: [
      { type: 'min-value', value: 50000, label: '$50,000+ portfolio value', isMet: false },
    ],
    rewards: [
      { type: 'card-back', value: 'gold', label: 'Golden card back', icon: '✨' },
      { type: 'fee-discount', value: 25, label: '25% fee discount (all trades)', icon: '💰' },
      { type: 'title', value: 'High Roller', label: '"High Roller" title', icon: '🎰' },
    ],
  },
  'diamond-collection': {
    id: 'diamond-collection',
    name: 'Diamond Collection',
    description: 'Hold 10 tokens for 30+ days each',
    icon: '💎',
    requirements: [
      { type: 'min-count', value: 10, label: '10 tokens', isMet: false },
      { type: 'category', value: '30-days', label: 'Held 30+ days each', isMet: false },
    ],
    rewards: [
      { type: 'card-back', value: 'diamond', label: 'Diamond card back', icon: '💎' },
      { type: 'airdrop-boost', value: 50, label: '50% airdrop boost', icon: '🪂' },
      { type: 'title', value: 'Diamond Hands', label: '"Diamond Hands" title', icon: '💎' },
    ],
  },
};

// Token rarity based on holders
export type TokenRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface TokenRarityInfo {
  rarity: TokenRarity;
  label: string;
  color: string;
  holdersThreshold: number;
  supplyPercent: number; // % of total supply
}

export const RARITY_THRESHOLDS: TokenRarityInfo[] = [
  { rarity: 'mythic', label: 'Mythic', color: '#FF00FF', holdersThreshold: 10, supplyPercent: 0.1 },
  { rarity: 'legendary', label: 'Legendary', color: '#FFD700', holdersThreshold: 50, supplyPercent: 1 },
  { rarity: 'epic', label: 'Epic', color: '#9400D3', holdersThreshold: 200, supplyPercent: 5 },
  { rarity: 'rare', label: 'Rare', color: '#4169E1', holdersThreshold: 500, supplyPercent: 15 },
  { rarity: 'uncommon', label: 'Uncommon', color: '#32CD32', holdersThreshold: 1000, supplyPercent: 30 },
  { rarity: 'common', label: 'Common', color: '#808080', holdersThreshold: Infinity, supplyPercent: 100 },
];

/**
 * Calculate token rarity based on holders
 */
export function getTokenRarity(holders: number): TokenRarityInfo {
  for (const tier of RARITY_THRESHOLDS) {
    if (holders <= tier.holdersThreshold) {
      return tier;
    }
  }
  return RARITY_THRESHOLDS[RARITY_THRESHOLDS.length - 1];
}

// Collection stats
export interface CollectionStats {
  totalTokens: number;
  totalValue: number;
  uniqueCategories: string[];
  completedSets: SetType[];
  unlockedBacks: CardBackType[];
  collectionScore: number; // 0-1000
  rank: CollectionRank;
  titles: string[];
  totalFeeDiscount: number;
  airdropBoost: number;
}

export type CollectionRank =
  | 'Novice'
  | 'Collector'
  | 'Enthusiast'
  | 'Connoisseur'
  | 'Master'
  | 'Grandmaster'
  | 'Legend';

const RANK_THRESHOLDS: { rank: CollectionRank; minScore: number }[] = [
  { rank: 'Legend', minScore: 900 },
  { rank: 'Grandmaster', minScore: 750 },
  { rank: 'Master', minScore: 600 },
  { rank: 'Connoisseur', minScore: 450 },
  { rank: 'Enthusiast', minScore: 300 },
  { rank: 'Collector', minScore: 150 },
  { rank: 'Novice', minScore: 0 },
];

/**
 * Calculate collection rank from score
 */
export function getCollectionRank(score: number): CollectionRank {
  for (const tier of RANK_THRESHOLDS) {
    if (score >= tier.minScore) {
      return tier.rank;
    }
  }
  return 'Novice';
}

/**
 * Calculate collection score
 * - Tokens owned: 10 points each (max 200)
 * - Categories covered: 50 points each (max 200)
 * - Sets completed: 100 points each (max 400)
 * - Card backs unlocked: 25 points each (max 200)
 */
export function calculateCollectionScore(
  tokenCount: number,
  categoriesCount: number,
  setsCompleted: number,
  backsUnlocked: number
): number {
  const tokenPoints = Math.min(tokenCount * 10, 200);
  const categoryPoints = Math.min(categoriesCount * 50, 200);
  const setPoints = Math.min(setsCompleted * 100, 400);
  const backPoints = Math.min(backsUnlocked * 25, 200);

  return tokenPoints + categoryPoints + setPoints + backPoints;
}

/**
 * Check which card backs should be unlocked
 */
export function checkCardBackUnlocks(
  holdings: Holding[],
  totalValue: number,
  totalHoldDays: number,
  maxMultiple: number,
  completedSets: SetType[],
  survivedDumps: number
): CardBackType[] {
  const unlocked: CardBackType[] = ['default'];

  // Botanical: Own 5 tokens
  if (holdings.length >= 5) unlocked.push('botanical');

  // Gold: Portfolio $10,000+
  if (totalValue >= 10000) unlocked.push('gold');

  // Holographic: Complete any set
  if (completedSets.length > 0) unlocked.push('holographic');

  // Diamond: Hold 60+ days total
  if (totalHoldDays >= 60) unlocked.push('diamond');

  // Fire: 10x on any token
  if (maxMultiple >= 10) unlocked.push('fire');

  // Ice: Survive 3 dumps
  if (survivedDumps >= 3) unlocked.push('ice');

  // Cosmic: Own from every category (check if full-deck is complete)
  if (completedSets.includes('full-deck')) unlocked.push('cosmic');

  // Legendary: 100x on any token
  if (maxMultiple >= 100) unlocked.push('legendary');

  // Custom: All sets complete
  if (completedSets.length === Object.keys(COLLECTION_SETS).length) unlocked.push('custom');

  return unlocked;
}

/**
 * Calculate set progress and completion
 */
export function calculateSetProgress(
  setId: SetType,
  holdings: (Holding & { token: Token })[],
  holdDaysMap: Record<string, number>
): CollectionSet {
  const setConfig = COLLECTION_SETS[setId];
  const requirements = [...setConfig.requirements];

  // Get unique categories in holdings
  const categories: string[] = [...new Set(holdings.map(h => h.token.category))];
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  // Check each requirement
  let metCount = 0;

  requirements.forEach((req, index) => {
    switch (req.type) {
      case 'category':
        if (req.value === '30-days') {
          // Special case for diamond collection
          const longHolds = Object.values(holdDaysMap).filter(days => days >= 30).length;
          requirements[index].isMet = longHolds >= 10;
        } else {
          requirements[index].isMet = categories.includes(req.value as string);
        }
        break;

      case 'min-count':
        const catHoldings = setConfig.id.includes('meme')
          ? holdings.filter(h => h.token.category === 'Creator')
          : setConfig.id.includes('ai')
          ? holdings.filter(h => h.token.category === 'AI')
          : holdings;
        requirements[index].isMet = catHoldings.length >= (req.value as number);
        break;

      case 'min-value':
        const catValue = setConfig.id.includes('gaming')
          ? holdings.filter(h => h.token.category === 'Gaming').reduce((s, h) => s + h.currentValue, 0)
          : totalValue;
        requirements[index].isMet = catValue >= (req.value as number);
        break;

      case 'rank':
        // Check if any holding has this rank
        const rankMap: Record<string, number> = {
          'J': 80, 'Q': 85, 'K': 90, 'A': 95, '80+': 80
        };
        const minScore = rankMap[req.value as string] || 0;
        const catFilter = setConfig.id.includes('defi') ? 'DeFi' : setConfig.id.includes('ai') ? 'AI' : null;
        const filtered = catFilter ? holdings.filter(h => h.token.category === catFilter) : holdings;
        requirements[index].isMet = filtered.some(h => h.token.score >= minScore);
        break;

      case 'suit':
        // Check for 5 tokens of same category
        const suitCounts = categories.map(cat => holdings.filter(h => h.token.category === cat).length);
        requirements[index].isMet = suitCounts.some(count => count >= 5);
        break;
    }

    if (requirements[index].isMet) metCount++;
  });

  const progress = Math.round((metCount / requirements.length) * 100);
  const isComplete = metCount === requirements.length;

  return {
    ...setConfig,
    requirements,
    progress,
    isComplete,
    completedAt: isComplete ? new Date().toISOString() : undefined,
  };
}

/**
 * Calculate full collection stats
 */
export function calculateCollectionStats(
  holdings: (Holding & { token: Token })[],
  holdDaysMap: Record<string, number> = {},
  maxMultiple: number = 1,
  survivedDumps: number = 0
): CollectionStats {
  const totalTokens = holdings.length;
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const uniqueCategories = [...new Set(holdings.map(h => h.token.category))];
  const totalHoldDays = Object.values(holdDaysMap).reduce((sum, d) => sum + d, 0);

  // Check all sets
  const sets = Object.keys(COLLECTION_SETS) as SetType[];
  const setResults = sets.map(setId => calculateSetProgress(setId, holdings, holdDaysMap));
  const completedSets = setResults.filter(s => s.isComplete).map(s => s.id);

  // Check card backs
  const unlockedBacks = checkCardBackUnlocks(
    holdings,
    totalValue,
    totalHoldDays,
    maxMultiple,
    completedSets,
    survivedDumps
  );

  // Calculate score and rank
  const collectionScore = calculateCollectionScore(
    totalTokens,
    uniqueCategories.length,
    completedSets.length,
    unlockedBacks.length
  );
  const rank = getCollectionRank(collectionScore);

  // Gather titles from completed sets
  const titles = setResults
    .filter(s => s.isComplete)
    .flatMap(s => s.rewards.filter(r => r.type === 'title').map(r => r.value as string));

  // Calculate total fee discount
  const totalFeeDiscount = setResults
    .filter(s => s.isComplete)
    .flatMap(s => s.rewards.filter(r => r.type === 'fee-discount'))
    .reduce((sum, r) => sum + (r.value as number), 0);

  // Calculate airdrop boost
  const airdropBoost = setResults
    .filter(s => s.isComplete)
    .flatMap(s => s.rewards.filter(r => r.type === 'airdrop-boost'))
    .reduce((sum, r) => sum + (r.value as number), 0);

  return {
    totalTokens,
    totalValue,
    uniqueCategories,
    completedSets,
    unlockedBacks,
    collectionScore,
    rank,
    titles,
    totalFeeDiscount,
    airdropBoost,
  };
}

// Mock user collection data
export const MOCK_COLLECTION_DATA = {
  selectedCardBack: 'botanical' as CardBackType,
  holdDaysMap: {
    'neural-nexus': 45,
    'defi-dragon': 60,
    'pixel-punks': 15,
    'meta-memes': 90,
  },
  maxMultiple: 12.5,
  survivedDumps: 2,
};

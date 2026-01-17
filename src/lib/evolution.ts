/**
 * Card Evolution System
 *
 * Cards evolve based on:
 * 1. Performance: Token price changes affect rank (10x = rank up, -50% = rank down)
 * 2. Diamond Hands: Holding for 30+ days adds gold border
 * 3. OG Status: First 100 buyers get OG badge
 * 4. Streak: Consecutive profitable trades add fire effect
 */

import type { Token } from './mock-data';

// Rank progression (lowest to highest)
export const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof RANK_ORDER[number];

// Evolution badge types
export type BadgeType =
  | 'og'           // First 100 buyers
  | 'diamond-hands' // Held 30+ days
  | 'whale'        // Top 10 holder
  | 'degen'        // 10+ trades on this token
  | 'lucky'        // Bought at ATL
  | 'prophet'      // Bought before 10x
  | 'survivor'     // Held through -50% dip
  | 'moonshot';    // Rode a 100x

export interface EvolutionBadge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

// Badge configurations
export const BADGE_CONFIG: Record<BadgeType, Omit<EvolutionBadge, 'type' | 'unlockedAt'>> = {
  'og': {
    name: 'OG',
    description: 'Among the first 100 buyers',
    icon: '🏆',
    rarity: 'rare',
  },
  'diamond-hands': {
    name: 'Diamond Hands',
    description: 'Held for 30+ days without selling',
    icon: '💎',
    rarity: 'epic',
  },
  'whale': {
    name: 'Whale',
    description: 'Top 10 holder by value',
    icon: '🐋',
    rarity: 'legendary',
  },
  'degen': {
    name: 'Degen',
    description: '10+ trades on this token',
    icon: '🎰',
    rarity: 'common',
  },
  'lucky': {
    name: 'Lucky',
    description: 'Bought at all-time low',
    icon: '🍀',
    rarity: 'epic',
  },
  'prophet': {
    name: 'Prophet',
    description: 'Bought before 10x run',
    icon: '🔮',
    rarity: 'legendary',
  },
  'survivor': {
    name: 'Survivor',
    description: 'Held through 50%+ dip',
    icon: '🛡️',
    rarity: 'rare',
  },
  'moonshot': {
    name: 'Moonshot',
    description: 'Rode a 100x gain',
    icon: '🚀',
    rarity: 'legendary',
  },
};

// Card visual effects based on evolution
export type CardEffect =
  | 'none'
  | 'glow'        // Slight glow for evolved cards
  | 'holographic' // Shifting rainbow effect
  | 'golden'      // Gold border/accents
  | 'fire'        // Animated fire border
  | 'ice'         // Frozen/crystal effect
  | 'legendary';  // Full legendary treatment

export interface CardEvolutionState {
  tokenId: string;
  baseRank: Rank;        // Original rank from score
  evolvedRank: Rank;     // Current rank after evolution
  rankChange: number;    // +/- from base (positive = upgrades)
  effect: CardEffect;
  badges: EvolutionBadge[];

  // Performance tracking
  buyPrice: number;
  currentPrice: number;
  priceMultiple: number; // currentPrice / buyPrice
  holdDays: number;
  tradeCount: number;

  // Timestamps
  firstBuyAt: string;
  lastTradeAt: string;

  // Evolution history
  evolutionHistory: EvolutionEvent[];
}

export interface EvolutionEvent {
  id: string;
  type: 'rank-up' | 'rank-down' | 'badge-earned' | 'effect-gained';
  description: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

// Thresholds for evolution
export const EVOLUTION_THRESHOLDS = {
  // Price multiples for rank changes
  rankUp: {
    tier1: 2,    // 2x = +1 rank
    tier2: 5,    // 5x = +2 ranks
    tier3: 10,   // 10x = +3 ranks
    tier4: 50,   // 50x = +4 ranks
    tier5: 100,  // 100x = +5 ranks (max)
  },
  rankDown: {
    tier1: 0.5,  // -50% = -1 rank
    tier2: 0.25, // -75% = -2 ranks
    tier3: 0.1,  // -90% = -3 ranks
  },

  // Badge thresholds
  diamondHands: 30,    // days
  degenTrades: 10,     // trade count
  whaleTopN: 10,       // top N holders
  ogBuyerCount: 100,   // first N buyers

  // Effect thresholds
  glowMultiple: 2,     // 2x for glow
  goldenMultiple: 10,  // 10x for golden
  fireMultiple: 25,    // 25x for fire
  legendaryMultiple: 100, // 100x for legendary
};

/**
 * Calculate rank changes based on price performance
 */
export function calculateRankChange(priceMultiple: number): number {
  const { rankUp, rankDown } = EVOLUTION_THRESHOLDS;

  if (priceMultiple >= rankUp.tier5) return 5;
  if (priceMultiple >= rankUp.tier4) return 4;
  if (priceMultiple >= rankUp.tier3) return 3;
  if (priceMultiple >= rankUp.tier2) return 2;
  if (priceMultiple >= rankUp.tier1) return 1;

  if (priceMultiple <= rankDown.tier3) return -3;
  if (priceMultiple <= rankDown.tier2) return -2;
  if (priceMultiple <= rankDown.tier1) return -1;

  return 0;
}

/**
 * Apply rank change to get evolved rank
 */
export function evolveRank(baseRank: Rank, change: number): Rank {
  const baseIndex = RANK_ORDER.indexOf(baseRank);
  const newIndex = Math.max(0, Math.min(RANK_ORDER.length - 1, baseIndex + change));
  return RANK_ORDER[newIndex];
}

/**
 * Determine card effect based on performance
 */
export function getCardEffect(priceMultiple: number, badges: EvolutionBadge[]): CardEffect {
  const { glowMultiple, goldenMultiple, fireMultiple, legendaryMultiple } = EVOLUTION_THRESHOLDS;

  // Legendary effect for moonshot badge holders
  if (badges.some(b => b.type === 'moonshot')) return 'legendary';

  // Diamond hands get golden effect
  if (badges.some(b => b.type === 'diamond-hands') && priceMultiple >= goldenMultiple) return 'golden';

  if (priceMultiple >= legendaryMultiple) return 'legendary';
  if (priceMultiple >= fireMultiple) return 'fire';
  if (priceMultiple >= goldenMultiple) return 'golden';
  if (priceMultiple >= glowMultiple) return 'glow';

  // Ice effect for survivors (held through dip)
  if (badges.some(b => b.type === 'survivor')) return 'ice';

  return 'none';
}

/**
 * Check and award badges based on holding data
 */
export function checkBadges(
  holdDays: number,
  tradeCount: number,
  priceMultiple: number,
  buyerRank: number, // What number buyer they were (1 = first)
  holderRank: number, // Current holder ranking by value
  lowestPriceMultiple: number, // Lowest price they bought at relative to ATL
  existingBadges: EvolutionBadge[]
): EvolutionBadge[] {
  const badges: EvolutionBadge[] = [...existingBadges];
  const now = new Date().toISOString();

  const hasBadge = (type: BadgeType) => badges.some(b => b.type === type);
  const addBadge = (type: BadgeType) => {
    if (!hasBadge(type)) {
      badges.push({
        type,
        ...BADGE_CONFIG[type],
        unlockedAt: now,
      });
    }
  };

  // OG badge
  if (buyerRank <= EVOLUTION_THRESHOLDS.ogBuyerCount) {
    addBadge('og');
  }

  // Diamond Hands badge
  if (holdDays >= EVOLUTION_THRESHOLDS.diamondHands) {
    addBadge('diamond-hands');
  }

  // Whale badge
  if (holderRank <= EVOLUTION_THRESHOLDS.whaleTopN) {
    addBadge('whale');
  }

  // Degen badge
  if (tradeCount >= EVOLUTION_THRESHOLDS.degenTrades) {
    addBadge('degen');
  }

  // Prophet badge (bought before 10x)
  if (priceMultiple >= 10) {
    addBadge('prophet');
  }

  // Lucky badge (bought at ATL - within 5%)
  if (lowestPriceMultiple <= 1.05) {
    addBadge('lucky');
  }

  // Moonshot badge
  if (priceMultiple >= 100) {
    addBadge('moonshot');
  }

  return badges;
}

/**
 * Calculate full evolution state for a holding
 */
export function calculateEvolution(
  token: Token,
  holdingData: {
    buyPrice: number;
    firstBuyAt: string;
    lastTradeAt: string;
    tradeCount: number;
    buyerRank: number;
    holderRank: number;
    lowestBuyPriceRatio: number;
    existingBadges?: EvolutionBadge[];
    previousEvolution?: CardEvolutionState;
  }
): CardEvolutionState {
  const {
    buyPrice,
    firstBuyAt,
    lastTradeAt,
    tradeCount,
    buyerRank,
    holderRank,
    lowestBuyPriceRatio,
    existingBadges = [],
    previousEvolution,
  } = holdingData;

  // Calculate price multiple
  const priceMultiple = token.price / buyPrice;

  // Calculate hold days
  const holdDays = Math.floor(
    (Date.now() - new Date(firstBuyAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get base rank from token score
  const baseRank = getRankFromScore(token.score);

  // Calculate rank change
  const rankChange = calculateRankChange(priceMultiple);
  const evolvedRank = evolveRank(baseRank, rankChange);

  // Check for new badges
  const badges = checkBadges(
    holdDays,
    tradeCount,
    priceMultiple,
    buyerRank,
    holderRank,
    lowestBuyPriceRatio,
    existingBadges
  );

  // Determine card effect
  const effect = getCardEffect(priceMultiple, badges);

  // Build evolution history
  const evolutionHistory: EvolutionEvent[] = previousEvolution?.evolutionHistory || [];
  const now = new Date().toISOString();

  // Check for rank changes
  if (previousEvolution && previousEvolution.evolvedRank !== evolvedRank) {
    evolutionHistory.push({
      id: `rank-${Date.now()}`,
      type: rankChange > (previousEvolution.rankChange || 0) ? 'rank-up' : 'rank-down',
      description: rankChange > (previousEvolution.rankChange || 0)
        ? `Card evolved from ${previousEvolution.evolvedRank} to ${evolvedRank}!`
        : `Card devolved from ${previousEvolution.evolvedRank} to ${evolvedRank}`,
      timestamp: now,
      oldValue: previousEvolution.evolvedRank,
      newValue: evolvedRank,
    });
  }

  // Check for new badges
  const newBadges = badges.filter(
    b => !existingBadges.some(eb => eb.type === b.type)
  );
  newBadges.forEach(badge => {
    evolutionHistory.push({
      id: `badge-${badge.type}-${Date.now()}`,
      type: 'badge-earned',
      description: `Earned ${badge.name} badge: ${badge.description}`,
      timestamp: now,
      newValue: badge.type,
    });
  });

  // Check for effect changes
  if (previousEvolution && previousEvolution.effect !== effect && effect !== 'none') {
    evolutionHistory.push({
      id: `effect-${Date.now()}`,
      type: 'effect-gained',
      description: `Card gained ${effect} effect!`,
      timestamp: now,
      oldValue: previousEvolution.effect,
      newValue: effect,
    });
  }

  return {
    tokenId: token.id,
    baseRank,
    evolvedRank,
    rankChange,
    effect,
    badges,
    buyPrice,
    currentPrice: token.price,
    priceMultiple,
    holdDays,
    tradeCount,
    firstBuyAt,
    lastTradeAt,
    evolutionHistory,
  };
}

// Helper to get rank from score (same as design-system but local)
function getRankFromScore(score: number): Rank {
  if (score >= 95) return 'A';
  if (score >= 90) return 'K';
  if (score >= 85) return 'Q';
  if (score >= 80) return 'J';
  if (score >= 70) return '10';
  if (score >= 60) return '9';
  if (score >= 50) return '8';
  if (score >= 40) return '7';
  if (score >= 30) return '6';
  if (score >= 20) return '5';
  if (score >= 15) return '4';
  if (score >= 10) return '3';
  return '2';
}

/**
 * Get CSS classes for card effect
 */
export function getEffectClasses(effect: CardEffect): string {
  switch (effect) {
    case 'glow':
      return 'shadow-lg shadow-botanical-500/30 ring-2 ring-botanical-400/50';
    case 'holographic':
      return 'bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 animate-gradient';
    case 'golden':
      return 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-500/40';
    case 'fire':
      return 'ring-4 ring-orange-500 shadow-xl shadow-orange-500/50 animate-pulse';
    case 'ice':
      return 'ring-4 ring-cyan-400 shadow-xl shadow-cyan-500/40';
    case 'legendary':
      return 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50 animate-pulse bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500';
    default:
      return '';
  }
}

/**
 * Get background gradient for evolved cards
 */
export function getEvolutionGradient(rankChange: number, effect: CardEffect): string {
  if (effect === 'legendary') {
    return 'bg-gradient-to-br from-yellow-100 via-purple-100 to-pink-100 dark:from-yellow-900/30 dark:via-purple-900/30 dark:to-pink-900/30';
  }
  if (effect === 'golden' || rankChange >= 3) {
    return 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20';
  }
  if (effect === 'fire') {
    return 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20';
  }
  if (effect === 'ice') {
    return 'bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20';
  }
  if (rankChange >= 1) {
    return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20';
  }
  if (rankChange <= -1) {
    return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900';
  }
  return '';
}

// Mock evolution data for demo
export const MOCK_EVOLUTION_DATA: Record<string, Partial<CardEvolutionState>> = {
  'neural-nexus': {
    buyPrice: 0.0012,
    priceMultiple: 4.17,
    holdDays: 45,
    tradeCount: 3,
    rankChange: 2,
    effect: 'glow',
    badges: [
      { type: 'og', ...BADGE_CONFIG['og'], unlockedAt: '2024-12-01' },
      { type: 'diamond-hands', ...BADGE_CONFIG['diamond-hands'], unlockedAt: '2025-01-01' },
    ],
  },
  'defi-dragon': {
    buyPrice: 0.0008,
    priceMultiple: 12.5,
    holdDays: 60,
    tradeCount: 8,
    rankChange: 3,
    effect: 'golden',
    badges: [
      { type: 'og', ...BADGE_CONFIG['og'], unlockedAt: '2024-11-15' },
      { type: 'diamond-hands', ...BADGE_CONFIG['diamond-hands'], unlockedAt: '2024-12-15' },
      { type: 'prophet', ...BADGE_CONFIG['prophet'], unlockedAt: '2025-01-10' },
    ],
  },
  'pixel-punks': {
    buyPrice: 0.0025,
    priceMultiple: 1.2,
    holdDays: 15,
    tradeCount: 2,
    rankChange: 0,
    effect: 'none',
    badges: [],
  },
  'meta-memes': {
    buyPrice: 0.0001,
    priceMultiple: 150,
    holdDays: 90,
    tradeCount: 12,
    rankChange: 5,
    effect: 'legendary',
    badges: [
      { type: 'og', ...BADGE_CONFIG['og'], unlockedAt: '2024-10-01' },
      { type: 'diamond-hands', ...BADGE_CONFIG['diamond-hands'], unlockedAt: '2024-11-01' },
      { type: 'prophet', ...BADGE_CONFIG['prophet'], unlockedAt: '2024-12-01' },
      { type: 'moonshot', ...BADGE_CONFIG['moonshot'], unlockedAt: '2025-01-15' },
      { type: 'degen', ...BADGE_CONFIG['degen'], unlockedAt: '2025-01-10' },
    ],
  },
};

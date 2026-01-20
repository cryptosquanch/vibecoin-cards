/**
 * Leaderboard System
 *
 * Multiple leaderboards:
 * 1. Hand Rankings - Best poker hands
 * 2. Portfolio - Highest portfolio values
 * 3. Collection - Best collection scores
 * 4. Battle - Top battlers by ELO
 * 5. Performance - Best returns
 */

import type { HandType } from './hands';
import type { CollectionRank } from './collections';
import type { BattleRank } from './battles';

export type LeaderboardType = 'hands' | 'portfolio' | 'collection' | 'battle' | 'performance' | 'xp' | 'volume' | 'diamond-hands';
export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly' | 'daily';

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  address: string;
  username?: string;
  avatar?: string;
  value: number;
  secondaryValue?: number;
  badge?: string;
  isCurrentUser?: boolean;
}

// Hand Leaderboard
export interface HandLeaderboardEntry extends LeaderboardEntry {
  handType: HandType;
  handName: string;
  cardCount: number;
  discount: number;
}

// Portfolio Leaderboard
export interface PortfolioLeaderboardEntry extends LeaderboardEntry {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  tokenCount: number;
}

// Collection Leaderboard
export interface CollectionLeaderboardEntry extends LeaderboardEntry {
  collectionScore: number;
  collectionRank: CollectionRank;
  completedSets: number;
  unlockedBacks: number;
}

// Battle Leaderboard
export interface BattleLeaderboardEntry extends LeaderboardEntry {
  elo: number;
  battleRank: BattleRank;
  wins: number;
  winRate: number;
  streak: number;
}

// Performance Leaderboard
export interface PerformanceLeaderboardEntry extends LeaderboardEntry {
  bestMultiple: number;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  currentPrice: number;
  holdDays: number;
}

// XP Leaderboard
export interface XPLeaderboardEntry extends LeaderboardEntry {
  totalXP: number;
  level: number;
  tier: string;
  prestige: number;
  weeklyXP: number;
}

// Volume Leaderboard
export interface VolumeLeaderboardEntry extends LeaderboardEntry {
  totalVolume: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  tradeCount: number;
}

// Diamond Hands Leaderboard
export interface DiamondHandsLeaderboardEntry extends LeaderboardEntry {
  longestHold: number; // days
  tokenName: string;
  tokenSymbol: string;
  holdingSince: string;
  currentValue: number;
  unrealizedPnl: number;
}

/**
 * Get rank change indicator
 */
export function getRankChange(current: number, previous?: number): {
  direction: 'up' | 'down' | 'same' | 'new';
  change: number;
} {
  if (previous === undefined) {
    return { direction: 'new', change: 0 };
  }
  if (current < previous) {
    return { direction: 'up', change: previous - current };
  }
  if (current > previous) {
    return { direction: 'down', change: current - previous };
  }
  return { direction: 'same', change: 0 };
}

/**
 * Format rank with suffix
 */
export function formatRank(rank: number): string {
  if (rank >= 11 && rank <= 13) {
    return `${rank}th`;
  }
  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

/**
 * Get medal for top 3
 */
export function getMedal(rank: number): string | null {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
}

// Mock Data
export const MOCK_HAND_LEADERBOARD: HandLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0xaaaa...1111',
    username: 'RoyalFlushKing',
    value: 50,
    handType: 'royal-flush',
    handName: 'Royal Flush',
    cardCount: 5,
    discount: 0.5,
  },
  {
    rank: 2,
    previousRank: 3,
    address: '0xbbbb...2222',
    username: 'PokerPro',
    value: 45,
    handType: 'straight-flush',
    handName: 'Straight Flush',
    cardCount: 5,
    discount: 0.45,
  },
  {
    rank: 3,
    previousRank: 2,
    address: '0xcccc...3333',
    username: 'QuadKing',
    value: 35,
    handType: 'four-of-a-kind',
    handName: 'Four of a Kind',
    cardCount: 4,
    discount: 0.35,
  },
  {
    rank: 4,
    previousRank: 4,
    address: '0xdddd...4444',
    username: 'FullHouse',
    value: 30,
    handType: 'full-house',
    handName: 'Full House',
    cardCount: 5,
    discount: 0.3,
  },
  {
    rank: 5,
    previousRank: 6,
    address: '0xeeee...5555',
    username: 'FlushMaster',
    value: 25,
    handType: 'flush',
    handName: 'Flush',
    cardCount: 5,
    discount: 0.25,
  },
  {
    rank: 6,
    address: '0x1234...5678',
    username: 'You',
    value: 20,
    handType: 'flush',
    handName: 'Flush',
    cardCount: 5,
    discount: 0.2,
    isCurrentUser: true,
  },
  {
    rank: 7,
    previousRank: 5,
    address: '0xffff...6666',
    username: 'StraightShooter',
    value: 18,
    handType: 'straight',
    handName: 'Straight',
    cardCount: 5,
    discount: 0.18,
  },
  {
    rank: 8,
    previousRank: 8,
    address: '0xgggg...7777',
    username: 'TripleKiller',
    value: 15,
    handType: 'three-of-a-kind',
    handName: 'Three of a Kind',
    cardCount: 3,
    discount: 0.15,
  },
  {
    rank: 9,
    previousRank: 9,
    address: '0xhhhh...8888',
    username: 'TwoPairTerry',
    value: 10,
    handType: 'two-pair',
    handName: 'Two Pair',
    cardCount: 4,
    discount: 0.1,
  },
  {
    rank: 10,
    previousRank: 11,
    address: '0xiiii...9999',
    username: 'PairMaker',
    value: 8,
    handType: 'pair',
    handName: 'Pair',
    cardCount: 2,
    discount: 0.08,
  },
];

export const MOCK_PORTFOLIO_LEADERBOARD: PortfolioLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0x1111...aaaa',
    username: 'WhaleAlert',
    value: 2450000,
    totalValue: 2450000,
    pnl: 1250000,
    pnlPercent: 104.2,
    tokenCount: 45,
  },
  {
    rank: 2,
    previousRank: 2,
    address: '0x2222...bbbb',
    username: 'DiamondHands',
    value: 1850000,
    totalValue: 1850000,
    pnl: 890000,
    pnlPercent: 92.7,
    tokenCount: 38,
  },
  {
    rank: 3,
    previousRank: 4,
    address: '0x3333...cccc',
    username: 'MoonMan',
    value: 1200000,
    totalValue: 1200000,
    pnl: 720000,
    pnlPercent: 150.0,
    tokenCount: 22,
  },
  {
    rank: 4,
    previousRank: 3,
    address: '0x4444...dddd',
    username: 'TokenTitan',
    value: 980000,
    totalValue: 980000,
    pnl: 380000,
    pnlPercent: 63.3,
    tokenCount: 31,
  },
  {
    rank: 5,
    previousRank: 5,
    address: '0x5555...eeee',
    username: 'CryptoQueen',
    value: 750000,
    totalValue: 750000,
    pnl: 450000,
    pnlPercent: 150.0,
    tokenCount: 18,
  },
  {
    rank: 42,
    address: '0x1234...5678',
    username: 'You',
    value: 12450,
    totalValue: 12450,
    pnl: 2340,
    pnlPercent: 23.1,
    tokenCount: 4,
    isCurrentUser: true,
  },
];

export const MOCK_COLLECTION_LEADERBOARD: CollectionLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0xaaaa...',
    username: 'CollectorKing',
    value: 950,
    collectionScore: 950,
    collectionRank: 'Legend',
    completedSets: 7,
    unlockedBacks: 9,
  },
  {
    rank: 2,
    previousRank: 2,
    address: '0xbbbb...',
    username: 'SetMaster',
    value: 875,
    collectionScore: 875,
    collectionRank: 'Grandmaster',
    completedSets: 6,
    unlockedBacks: 8,
  },
  {
    rank: 3,
    previousRank: 3,
    address: '0xcccc...',
    username: 'CardHoarder',
    value: 780,
    collectionScore: 780,
    collectionRank: 'Grandmaster',
    completedSets: 5,
    unlockedBacks: 7,
  },
  {
    rank: 4,
    previousRank: 5,
    address: '0xdddd...',
    username: 'DeckBuilder',
    value: 650,
    collectionScore: 650,
    collectionRank: 'Master',
    completedSets: 4,
    unlockedBacks: 6,
  },
  {
    rank: 5,
    previousRank: 4,
    address: '0xeeee...',
    username: 'RarityHunter',
    value: 620,
    collectionScore: 620,
    collectionRank: 'Master',
    completedSets: 4,
    unlockedBacks: 5,
  },
  {
    rank: 28,
    address: '0x1234...5678',
    username: 'You',
    value: 285,
    collectionScore: 285,
    collectionRank: 'Collector',
    completedSets: 1,
    unlockedBacks: 3,
    isCurrentUser: true,
  },
];

export const MOCK_PERFORMANCE_LEADERBOARD: PerformanceLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0x1111...',
    username: 'MoonshotMike',
    value: 250,
    bestMultiple: 250,
    tokenName: 'Neural Nexus',
    tokenSymbol: 'NEURAL',
    entryPrice: 0.0001,
    currentPrice: 0.025,
    holdDays: 45,
  },
  {
    rank: 2,
    previousRank: 2,
    address: '0x2222...',
    username: 'EarlyBird',
    value: 180,
    bestMultiple: 180,
    tokenName: 'DeFi Dragon',
    tokenSymbol: 'DRAGON',
    entryPrice: 0.0005,
    currentPrice: 0.09,
    holdDays: 60,
  },
  {
    rank: 3,
    previousRank: 4,
    address: '0x3333...',
    username: 'DiamondDave',
    value: 125,
    bestMultiple: 125,
    tokenName: 'Pixel Punks',
    tokenSymbol: 'PIXEL',
    entryPrice: 0.001,
    currentPrice: 0.125,
    holdDays: 90,
  },
  {
    rank: 4,
    previousRank: 3,
    address: '0x4444...',
    username: 'HodlQueen',
    value: 98,
    bestMultiple: 98,
    tokenName: 'Meta Memes',
    tokenSymbol: 'MEME',
    entryPrice: 0.002,
    currentPrice: 0.196,
    holdDays: 120,
  },
  {
    rank: 5,
    previousRank: 5,
    address: '0x5555...',
    username: 'GemFinder',
    value: 75,
    bestMultiple: 75,
    tokenName: 'AI Agent',
    tokenSymbol: 'AGENT',
    entryPrice: 0.004,
    currentPrice: 0.3,
    holdDays: 30,
  },
  {
    rank: 156,
    address: '0x1234...5678',
    username: 'You',
    value: 12.5,
    bestMultiple: 12.5,
    tokenName: 'DeFi Dragon',
    tokenSymbol: 'DRAGON',
    entryPrice: 0.008,
    currentPrice: 0.1,
    holdDays: 35,
    isCurrentUser: true,
  },
];

export const MOCK_XP_LEADERBOARD: XPLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0xXP01...',
    username: 'XPGrinder',
    value: 125000,
    totalXP: 125000,
    level: 50,
    tier: 'Legend',
    prestige: 2,
    weeklyXP: 8500,
  },
  {
    rank: 2,
    previousRank: 2,
    address: '0xXP02...',
    username: 'QuestMaster',
    value: 98500,
    totalXP: 98500,
    level: 48,
    tier: 'Legend',
    prestige: 1,
    weeklyXP: 6200,
  },
  {
    rank: 3,
    previousRank: 4,
    address: '0xXP03...',
    username: 'DailyDevotee',
    value: 75000,
    totalXP: 75000,
    level: 42,
    tier: 'Master',
    prestige: 1,
    weeklyXP: 7800,
  },
  {
    rank: 4,
    previousRank: 3,
    address: '0xXP04...',
    username: 'StreakKing',
    value: 62000,
    totalXP: 62000,
    level: 38,
    tier: 'Master',
    prestige: 0,
    weeklyXP: 4500,
  },
  {
    rank: 5,
    previousRank: 5,
    address: '0xXP05...',
    username: 'AchievementHunter',
    value: 48500,
    totalXP: 48500,
    level: 32,
    tier: 'Expert',
    prestige: 0,
    weeklyXP: 3200,
  },
  {
    rank: 89,
    address: '0x1234...5678',
    username: 'You',
    value: 2450,
    totalXP: 2450,
    level: 8,
    tier: 'Apprentice',
    prestige: 0,
    weeklyXP: 850,
    isCurrentUser: true,
  },
];

export const MOCK_VOLUME_LEADERBOARD: VolumeLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0xVOL1...',
    username: 'MegaTrader',
    value: 15800000,
    totalVolume: 15800000,
    volume24h: 450000,
    volume7d: 2100000,
    volume30d: 8500000,
    tradeCount: 2847,
  },
  {
    rank: 2,
    previousRank: 3,
    address: '0xVOL2...',
    username: 'VolumeKing',
    value: 12500000,
    totalVolume: 12500000,
    volume24h: 380000,
    volume7d: 1800000,
    volume30d: 6200000,
    tradeCount: 1956,
  },
  {
    rank: 3,
    previousRank: 2,
    address: '0xVOL3...',
    username: 'FlipMaster',
    value: 9200000,
    totalVolume: 9200000,
    volume24h: 520000,
    volume7d: 2400000,
    volume30d: 5100000,
    tradeCount: 3421,
  },
  {
    rank: 4,
    previousRank: 4,
    address: '0xVOL4...',
    username: 'SwingTrader',
    value: 7800000,
    totalVolume: 7800000,
    volume24h: 180000,
    volume7d: 950000,
    volume30d: 3800000,
    tradeCount: 892,
  },
  {
    rank: 5,
    previousRank: 6,
    address: '0xVOL5...',
    username: 'DayTraderPro',
    value: 6100000,
    totalVolume: 6100000,
    volume24h: 620000,
    volume7d: 1950000,
    volume30d: 2800000,
    tradeCount: 4215,
  },
  {
    rank: 234,
    address: '0x1234...5678',
    username: 'You',
    value: 45600,
    totalVolume: 45600,
    volume24h: 2500,
    volume7d: 12000,
    volume30d: 28000,
    tradeCount: 47,
    isCurrentUser: true,
  },
];

export const MOCK_DIAMOND_HANDS_LEADERBOARD: DiamondHandsLeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    address: '0xDH01...',
    username: 'TrueBeliever',
    value: 365,
    longestHold: 365,
    tokenName: 'Neural Nexus',
    tokenSymbol: 'NEURAL',
    holdingSince: '2024-01-15',
    currentValue: 125000,
    unrealizedPnl: 118750,
  },
  {
    rank: 2,
    previousRank: 2,
    address: '0xDH02...',
    username: 'PatientPete',
    value: 312,
    longestHold: 312,
    tokenName: 'DeFi Dragon',
    tokenSymbol: 'DRAGON',
    holdingSince: '2024-03-10',
    currentValue: 89000,
    unrealizedPnl: 76500,
  },
  {
    rank: 3,
    previousRank: 3,
    address: '0xDH03...',
    username: 'LongTermLisa',
    value: 285,
    longestHold: 285,
    tokenName: 'Pixel Punks',
    tokenSymbol: 'PIXEL',
    holdingSince: '2024-04-05',
    currentValue: 67500,
    unrealizedPnl: 52000,
  },
  {
    rank: 4,
    previousRank: 5,
    address: '0xDH04...',
    username: 'SteadyEddie',
    value: 248,
    longestHold: 248,
    tokenName: 'AI Agent',
    tokenSymbol: 'AGENT',
    holdingSince: '2024-05-15',
    currentValue: 45000,
    unrealizedPnl: 38200,
  },
  {
    rank: 5,
    previousRank: 4,
    address: '0xDH05...',
    username: 'HodlHero',
    value: 225,
    longestHold: 225,
    tokenName: 'Meta Memes',
    tokenSymbol: 'MEME',
    holdingSince: '2024-06-08',
    currentValue: 32000,
    unrealizedPnl: 24500,
  },
  {
    rank: 78,
    address: '0x1234...5678',
    username: 'You',
    value: 45,
    longestHold: 45,
    tokenName: 'DeFi Dragon',
    tokenSymbol: 'DRAGON',
    holdingSince: '2024-12-05',
    currentValue: 8500,
    unrealizedPnl: 2340,
    isCurrentUser: true,
  },
];

// Combined leaderboard config
export interface LeaderboardConfig {
  type: LeaderboardType;
  title: string;
  icon: string;
  description: string;
  valueLabel: string;
  valueFormat: (value: number) => string;
}

export const LEADERBOARD_CONFIGS: Record<LeaderboardType, LeaderboardConfig> = {
  hands: {
    type: 'hands',
    title: 'Best Hands',
    icon: '🃏',
    description: 'Players with the strongest poker hands',
    valueLabel: 'Discount',
    valueFormat: (v) => `${v}%`,
  },
  portfolio: {
    type: 'portfolio',
    title: 'Top Portfolios',
    icon: '💰',
    description: 'Highest portfolio values',
    valueLabel: 'Value',
    valueFormat: (v) => `$${v.toLocaleString()}`,
  },
  collection: {
    type: 'collection',
    title: 'Top Collectors',
    icon: '🏆',
    description: 'Best collection scores',
    valueLabel: 'Score',
    valueFormat: (v) => v.toString(),
  },
  battle: {
    type: 'battle',
    title: 'Battle Champions',
    icon: '⚔️',
    description: 'Highest rated battlers',
    valueLabel: 'ELO',
    valueFormat: (v) => v.toString(),
  },
  performance: {
    type: 'performance',
    title: 'Best Gains',
    icon: '🚀',
    description: 'Highest token multiples',
    valueLabel: 'Multiple',
    valueFormat: (v) => `${v}x`,
  },
  xp: {
    type: 'xp',
    title: 'XP Leaders',
    icon: '⭐',
    description: 'Most experienced players',
    valueLabel: 'Total XP',
    valueFormat: (v) => v.toLocaleString(),
  },
  volume: {
    type: 'volume',
    title: 'Trading Volume',
    icon: '📊',
    description: 'Highest all-time trading volume',
    valueLabel: 'Volume',
    valueFormat: (v) => `$${(v / 1000000).toFixed(1)}M`,
  },
  'diamond-hands': {
    type: 'diamond-hands',
    title: 'Diamond Hands',
    icon: '💎',
    description: 'Longest token hold durations',
    valueLabel: 'Days Held',
    valueFormat: (v) => `${v}d`,
  },
};

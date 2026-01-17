/**
 * Battle System
 *
 * Features:
 * 1. 1v1 Hand Battles - Compare poker hands
 * 2. Card Duels - Individual card showdowns
 * 3. Tournament System - Bracket-style competitions
 * 4. Wager System - Stake tokens on battles
 * 5. Battle History & Stats
 */

import type { Token } from './mock-data';
import { evaluateHand, type HandResult, HAND_CONFIG } from './hands';

// Battle types
export type BattleType = 'hand-battle' | 'card-duel' | 'tournament';
export type BattleStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'declined' | 'expired';
export type BattleResult = 'win' | 'loss' | 'draw';

export interface BattlePlayer {
  address: string;
  username?: string;
  avatar?: string;
  hand?: HandResult;
  selectedCards?: Token[];
  isReady: boolean;
}

export interface Battle {
  id: string;
  type: BattleType;
  status: BattleStatus;
  challenger: BattlePlayer;
  opponent: BattlePlayer;
  wager?: BattleWager;
  winner?: string; // address
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

export interface BattleWager {
  type: 'tokens' | 'points' | 'none';
  amount: number;
  tokenId?: string; // if wagering specific token
}

export interface BattleStats {
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  winStreak: number;
  bestWinStreak: number;
  totalWagersWon: number;
  totalWagersLost: number;
  rank: BattleRank;
  elo: number;
}

export type BattleRank =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Legend';

const RANK_THRESHOLDS: { rank: BattleRank; minElo: number; icon: string }[] = [
  { rank: 'Legend', minElo: 2400, icon: '👑' },
  { rank: 'Grandmaster', minElo: 2200, icon: '💎' },
  { rank: 'Master', minElo: 2000, icon: '🏆' },
  { rank: 'Diamond', minElo: 1800, icon: '💠' },
  { rank: 'Platinum', minElo: 1600, icon: '🥇' },
  { rank: 'Gold', minElo: 1400, icon: '🥈' },
  { rank: 'Silver', minElo: 1200, icon: '🥉' },
  { rank: 'Bronze', minElo: 0, icon: '🔰' },
];

/**
 * Get battle rank from ELO
 */
export function getBattleRank(elo: number): { rank: BattleRank; icon: string } {
  for (const tier of RANK_THRESHOLDS) {
    if (elo >= tier.minElo) {
      return { rank: tier.rank, icon: tier.icon };
    }
  }
  return { rank: 'Bronze', icon: '🔰' };
}

/**
 * Calculate ELO change after battle
 */
export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  isDraw: boolean = false
): { winnerChange: number; loserChange: number } {
  const K = 32; // K-factor
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;

  if (isDraw) {
    const winnerChange = Math.round(K * (0.5 - expectedWinner));
    const loserChange = Math.round(K * (0.5 - expectedLoser));
    return { winnerChange, loserChange };
  }

  const winnerChange = Math.round(K * (1 - expectedWinner));
  const loserChange = Math.round(K * (0 - expectedLoser));

  return { winnerChange, loserChange };
}

/**
 * Compare two hands and determine winner
 */
export function compareHands(hand1: HandResult, hand2: HandResult): 'player1' | 'player2' | 'draw' {
  const rank1 = HAND_CONFIG[hand1.type]?.strength || 0;
  const rank2 = HAND_CONFIG[hand2.type]?.strength || 0;

  if (rank1 > rank2) return 'player1';
  if (rank2 > rank1) return 'player2';

  // Same hand type - compare by hand strength (calculated during evaluation)
  const strength1 = hand1.strength;
  const strength2 = hand2.strength;

  if (strength1 > strength2) return 'player1';
  if (strength2 > strength1) return 'player2';

  return 'draw';
}

/**
 * Compare individual cards for duel
 */
export function compareCards(card1: Token, card2: Token): 'player1' | 'player2' | 'draw' {
  // Primary: Score
  if (card1.score > card2.score) return 'player1';
  if (card2.score > card1.score) return 'player2';

  // Tiebreaker: Market cap
  if (card1.marketCap > card2.marketCap) return 'player1';
  if (card2.marketCap > card1.marketCap) return 'player2';

  // Tiebreaker: 24h change
  if (card1.priceChange24h > card2.priceChange24h) return 'player1';
  if (card2.priceChange24h > card1.priceChange24h) return 'player2';

  return 'draw';
}

/**
 * Calculate battle rewards
 */
export interface BattleRewards {
  eloChange: number;
  pointsEarned: number;
  wagerWon?: number;
  streakBonus?: number;
  achievements?: string[];
}

export function calculateBattleRewards(
  result: BattleResult,
  battle: Battle,
  currentStreak: number,
  opponentElo: number,
  playerElo: number
): BattleRewards {
  const rewards: BattleRewards = {
    eloChange: 0,
    pointsEarned: 0,
  };

  if (result === 'draw') {
    const { winnerChange } = calculateEloChange(playerElo, opponentElo, true);
    rewards.eloChange = winnerChange;
    rewards.pointsEarned = 5;
    return rewards;
  }

  const isWin = result === 'win';
  const { winnerChange, loserChange } = calculateEloChange(
    isWin ? playerElo : opponentElo,
    isWin ? opponentElo : playerElo
  );

  rewards.eloChange = isWin ? winnerChange : loserChange;
  rewards.pointsEarned = isWin ? 25 : 5;

  // Streak bonus
  if (isWin && currentStreak >= 3) {
    rewards.streakBonus = Math.min(currentStreak * 5, 50);
    rewards.pointsEarned += rewards.streakBonus;
  }

  // Wager
  if (battle.wager && battle.wager.type !== 'none') {
    rewards.wagerWon = isWin ? battle.wager.amount : -battle.wager.amount;
  }

  // Check for achievements
  rewards.achievements = [];
  if (isWin && currentStreak === 5) {
    rewards.achievements.push('Hot Streak');
  }
  if (isWin && currentStreak === 10) {
    rewards.achievements.push('Unstoppable');
  }

  return rewards;
}

// Tournament system
export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'single-elimination' | 'double-elimination' | 'round-robin';
  status: 'registration' | 'in-progress' | 'completed';
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  startTime: string;
  endTime?: string;
  winner?: string;
}

export interface TournamentParticipant {
  address: string;
  username?: string;
  seed: number;
  isEliminated: boolean;
  wins: number;
  losses: number;
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  player1?: string;
  player2?: string;
  winner?: string;
  battle?: Battle;
  scheduledAt?: string;
}

/**
 * Generate tournament brackets
 */
export function generateBrackets(participants: string[]): TournamentBracket[] {
  // Pad to power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const padded = [...participants];
  while (padded.length < size) {
    padded.push('BYE');
  }

  // Shuffle
  const shuffled = padded.sort(() => Math.random() - 0.5);

  // Generate rounds
  const brackets: TournamentBracket[] = [];
  let currentRound = shuffled;
  let roundNum = 1;

  while (currentRound.length > 1) {
    const matches: TournamentMatch[] = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      matches.push({
        id: `R${roundNum}-M${Math.floor(i / 2) + 1}`,
        player1: currentRound[i] !== 'BYE' ? currentRound[i] : undefined,
        player2: currentRound[i + 1] !== 'BYE' ? currentRound[i + 1] : undefined,
        // Auto-advance if BYE
        winner: currentRound[i] === 'BYE'
          ? currentRound[i + 1]
          : currentRound[i + 1] === 'BYE'
            ? currentRound[i]
            : undefined,
      });
    }

    brackets.push({ round: roundNum, matches });

    // Next round has half the players
    currentRound = new Array(currentRound.length / 2).fill(null);
    roundNum++;
  }

  return brackets;
}

// Challenge system
export interface Challenge {
  id: string;
  from: string;
  to: string;
  battleType: BattleType;
  wager?: BattleWager;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

/**
 * Create a challenge
 */
export function createChallenge(
  from: string,
  to: string,
  battleType: BattleType,
  wager?: BattleWager,
  message?: string
): Challenge {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from,
    to,
    battleType,
    wager,
    message,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

// Mock data
export const MOCK_BATTLE_STATS: BattleStats = {
  totalBattles: 47,
  wins: 28,
  losses: 17,
  draws: 2,
  winRate: 59.6,
  winStreak: 3,
  bestWinStreak: 7,
  totalWagersWon: 1250,
  totalWagersLost: 450,
  rank: 'Gold',
  elo: 1456,
};

export const MOCK_RECENT_BATTLES: Battle[] = [
  {
    id: 'battle-1',
    type: 'hand-battle',
    status: 'completed',
    challenger: {
      address: '0x1234...5678',
      username: 'CryptoKing',
      isReady: true,
      hand: {
        type: 'flush',
        name: 'Flush',
        description: '5 cards of the same category',
        cards: [],
        feeDiscount: 20,
        strength: 80,
      },
    },
    opponent: {
      address: '0xabcd...efgh',
      username: 'DegenMaster',
      isReady: true,
      hand: {
        type: 'two-pair',
        name: 'Two Pair',
        description: '2 different pairs',
        cards: [],
        feeDiscount: 8,
        strength: 45,
      },
    },
    winner: '0x1234...5678',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    wager: { type: 'points', amount: 100 },
  },
  {
    id: 'battle-2',
    type: 'hand-battle',
    status: 'completed',
    challenger: {
      address: '0x1234...5678',
      username: 'CryptoKing',
      isReady: true,
      hand: {
        type: 'pair',
        name: 'Pair',
        description: '2 cards of same rank',
        cards: [],
        feeDiscount: 5,
        strength: 30,
      },
    },
    opponent: {
      address: '0x9999...1111',
      username: 'WhaleHunter',
      isReady: true,
      hand: {
        type: 'three-of-a-kind',
        name: 'Three of a Kind',
        description: '3 cards of same rank',
        cards: [],
        feeDiscount: 12,
        strength: 55,
      },
    },
    winner: '0x9999...1111',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'battle-3',
    type: 'card-duel',
    status: 'completed',
    challenger: {
      address: '0x1234...5678',
      username: 'CryptoKing',
      isReady: true,
    },
    opponent: {
      address: '0x5555...6666',
      username: 'TokenTrader',
      isReady: true,
    },
    winner: '0x1234...5678',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    wager: { type: 'points', amount: 50 },
  },
];

export const MOCK_PENDING_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-1',
    from: '0xaaaa...bbbb',
    to: '0x1234...5678',
    battleType: 'hand-battle',
    wager: { type: 'points', amount: 200 },
    message: 'Think you can beat my Royal Flush? 👑',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_ACTIVE_TOURNAMENTS: Tournament[] = [
  {
    id: 'tournament-1',
    name: 'Weekly Showdown',
    description: 'Weekly tournament with 100 $VIBE prize pool',
    type: 'single-elimination',
    status: 'registration',
    entryFee: 10,
    prizePool: 100,
    maxParticipants: 16,
    participants: [
      { address: '0x1111...', seed: 1, isEliminated: false, wins: 0, losses: 0 },
      { address: '0x2222...', seed: 2, isEliminated: false, wins: 0, losses: 0 },
      { address: '0x3333...', seed: 3, isEliminated: false, wins: 0, losses: 0 },
    ],
    brackets: [],
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Leaderboard types (used in battles context)
export interface BattleLeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  elo: number;
  battleRank: BattleRank;
  wins: number;
  winRate: number;
  streak: number;
}

export const MOCK_BATTLE_LEADERBOARD: BattleLeaderboardEntry[] = [
  { rank: 1, address: '0xaaaa...', username: 'CardMaster', elo: 2450, battleRank: 'Legend', wins: 156, winRate: 78.2, streak: 12 },
  { rank: 2, address: '0xbbbb...', username: 'PokerPro', elo: 2380, battleRank: 'Grandmaster', wins: 142, winRate: 74.5, streak: 8 },
  { rank: 3, address: '0xcccc...', username: 'DegenKing', elo: 2290, battleRank: 'Grandmaster', wins: 128, winRate: 71.1, streak: 5 },
  { rank: 4, address: '0xdddd...', username: 'WhaleAlert', elo: 2150, battleRank: 'Master', wins: 115, winRate: 68.9, streak: 3 },
  { rank: 5, address: '0xeeee...', username: 'TokenTitan', elo: 2080, battleRank: 'Master', wins: 98, winRate: 65.3, streak: 2 },
  { rank: 6, address: '0x1234...5678', username: 'CryptoKing', elo: 1456, battleRank: 'Gold', wins: 28, winRate: 59.6, streak: 3 },
];

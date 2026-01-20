/**
 * Daily & Weekly Quests System
 *
 * Features:
 * 1. Daily Quests - Reset at 00:00 UTC
 * 2. Weekly Quests - Reset on Monday 00:00 UTC
 * 3. XP Rewards for completion
 * 4. Progress tracking with localStorage
 */

export type QuestType = 'daily' | 'weekly';
export type QuestCategory = 'explorer' | 'trader' | 'curator' | 'analyst' | 'collector' | 'warrior' | 'achiever';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'claimed';

export interface Quest {
  id: string;
  type: QuestType;
  category: QuestCategory;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: {
    action: string;
    target: number;
  };
  progress: number;
  status: QuestStatus;
}

export interface QuestProgress {
  questId: string;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: string;
  claimedAt?: string;
}

export interface DailyQuestState {
  date: string; // YYYY-MM-DD in UTC
  quests: QuestProgress[];
  totalXPEarned: number;
}

export interface WeeklyQuestState {
  weekStart: string; // YYYY-MM-DD (Monday) in UTC
  quests: QuestProgress[];
  totalXPEarned: number;
}

// Daily Quest Definitions
export const DAILY_QUESTS: Omit<Quest, 'progress' | 'status'>[] = [
  {
    id: 'daily-explorer',
    type: 'daily',
    category: 'explorer',
    name: 'Explorer',
    description: 'View 3 token pages',
    icon: '🔍',
    xpReward: 25,
    requirement: { action: 'view_token', target: 3 },
  },
  {
    id: 'daily-trader',
    type: 'daily',
    category: 'trader',
    name: 'Trader',
    description: 'Complete 1 trade',
    icon: '💱',
    xpReward: 50,
    requirement: { action: 'complete_trade', target: 1 },
  },
  {
    id: 'daily-curator',
    type: 'daily',
    category: 'curator',
    name: 'Curator',
    description: 'Add 2 tokens to watchlist',
    icon: '⭐',
    xpReward: 25,
    requirement: { action: 'add_watchlist', target: 2 },
  },
  {
    id: 'daily-analyst',
    type: 'daily',
    category: 'analyst',
    name: 'Analyst',
    description: 'Check the leaderboards',
    icon: '📊',
    xpReward: 15,
    requirement: { action: 'view_leaderboard', target: 1 },
  },
];

// Weekly Quest Definitions
export const WEEKLY_QUESTS: Omit<Quest, 'progress' | 'status'>[] = [
  {
    id: 'weekly-collector',
    type: 'weekly',
    category: 'collector',
    name: 'Collector',
    description: 'Hold 5+ different tokens',
    icon: '🎯',
    xpReward: 100,
    requirement: { action: 'hold_tokens', target: 5 },
  },
  {
    id: 'weekly-warrior',
    type: 'weekly',
    category: 'warrior',
    name: 'Warrior',
    description: 'Win 3 battles',
    icon: '⚔️',
    xpReward: 150,
    requirement: { action: 'battle_wins', target: 3 },
  },
  {
    id: 'weekly-achiever',
    type: 'weekly',
    category: 'achiever',
    name: 'Achiever',
    description: 'Unlock 1 new badge',
    icon: '🏆',
    xpReward: 100,
    requirement: { action: 'unlock_achievement', target: 1 },
  },
  {
    id: 'weekly-volume',
    type: 'weekly',
    category: 'trader',
    name: 'Volume King',
    description: 'Trade $500+ total volume',
    icon: '📈',
    xpReward: 200,
    requirement: { action: 'trade_volume', target: 500 },
  },
];

// Helper: Get current UTC date as YYYY-MM-DD
export function getUTCDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Helper: Get current week's Monday in UTC
export function getWeekStartString(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setUTCDate(diff));
  return monday.toISOString().split('T')[0];
}

// Helper: Calculate time until reset
export function getTimeUntilDailyReset(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

export function getTimeUntilWeeklyReset(): { days: number; hours: number } {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;

  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);

  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours };
}

// Initialize quests with fresh progress
export function initializeDailyQuests(): DailyQuestState {
  return {
    date: getUTCDateString(),
    quests: DAILY_QUESTS.map(q => ({
      questId: q.id,
      currentValue: 0,
      completed: false,
      claimed: false,
    })),
    totalXPEarned: 0,
  };
}

export function initializeWeeklyQuests(): WeeklyQuestState {
  return {
    weekStart: getWeekStartString(),
    quests: WEEKLY_QUESTS.map(q => ({
      questId: q.id,
      currentValue: 0,
      completed: false,
      claimed: false,
    })),
    totalXPEarned: 0,
  };
}

// Check if quests need to be reset
export function shouldResetDailyQuests(state: DailyQuestState | null): boolean {
  if (!state) return true;
  return state.date !== getUTCDateString();
}

export function shouldResetWeeklyQuests(state: WeeklyQuestState | null): boolean {
  if (!state) return true;
  return state.weekStart !== getWeekStartString();
}

// Update quest progress
export function updateQuestProgress(
  quests: QuestProgress[],
  questId: string,
  newValue: number,
  target: number
): QuestProgress[] {
  return quests.map(q => {
    if (q.questId !== questId) return q;
    if (q.claimed) return q; // Don't update claimed quests

    const completed = newValue >= target;
    return {
      ...q,
      currentValue: newValue,
      completed,
      completedAt: completed && !q.completed ? new Date().toISOString() : q.completedAt,
    };
  });
}

// Claim quest reward
export function claimQuestReward(
  quests: QuestProgress[],
  questId: string
): { quests: QuestProgress[]; xpEarned: number } {
  let xpEarned = 0;

  const updatedQuests = quests.map(q => {
    if (q.questId !== questId) return q;
    if (!q.completed || q.claimed) return q;

    // Find the quest definition to get XP reward
    const questDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(d => d.id === questId);
    if (questDef) {
      xpEarned = questDef.xpReward;
    }

    return {
      ...q,
      claimed: true,
      claimedAt: new Date().toISOString(),
    };
  });

  return { quests: updatedQuests, xpEarned };
}

// Get full quest with progress merged
export function getQuestsWithProgress(
  definitions: Omit<Quest, 'progress' | 'status'>[],
  progress: QuestProgress[]
): Quest[] {
  return definitions.map(def => {
    const prog = progress.find(p => p.questId === def.id);
    const currentValue = prog?.currentValue || 0;
    const completed = prog?.completed || false;
    const claimed = prog?.claimed || false;

    let status: QuestStatus = 'available';
    if (claimed) status = 'claimed';
    else if (completed) status = 'completed';
    else if (currentValue > 0) status = 'in_progress';

    return {
      ...def,
      progress: currentValue,
      status,
    };
  });
}

// Calculate total completable XP
export function getTotalAvailableXP(): { daily: number; weekly: number } {
  const daily = DAILY_QUESTS.reduce((sum, q) => sum + q.xpReward, 0);
  const weekly = WEEKLY_QUESTS.reduce((sum, q) => sum + q.xpReward, 0);
  return { daily, weekly };
}

// Quest action types for tracking
export type QuestAction =
  | 'view_token'
  | 'complete_trade'
  | 'add_watchlist'
  | 'view_leaderboard'
  | 'hold_tokens'
  | 'battle_wins'
  | 'unlock_achievement'
  | 'trade_volume';

// Map actions to quest IDs
export const ACTION_TO_QUEST_MAP: Record<QuestAction, string[]> = {
  view_token: ['daily-explorer'],
  complete_trade: ['daily-trader'],
  add_watchlist: ['daily-curator'],
  view_leaderboard: ['daily-analyst'],
  hold_tokens: ['weekly-collector'],
  battle_wins: ['weekly-warrior'],
  unlock_achievement: ['weekly-achiever'],
  trade_volume: ['weekly-volume'],
};

// Format time remaining
export function formatTimeRemaining(time: { hours: number; minutes: number } | { days: number; hours: number }): string {
  if ('days' in time) {
    if (time.days > 0) return `${time.days}d ${time.hours}h`;
    return `${time.hours}h`;
  }
  if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
  return `${time.minutes}m`;
}

// Streak bonus calculation
export function calculateStreakBonus(consecutiveDays: number): number {
  if (consecutiveDays < 3) return 0;
  if (consecutiveDays < 7) return 10; // 10% bonus
  if (consecutiveDays < 14) return 25; // 25% bonus
  if (consecutiveDays < 30) return 50; // 50% bonus
  return 100; // 100% bonus for 30+ day streak
}

// Get streak badge
export function getStreakBadge(consecutiveDays: number): { emoji: string; label: string } | null {
  if (consecutiveDays < 3) return null;
  if (consecutiveDays < 7) return { emoji: '🔥', label: '3-Day Streak' };
  if (consecutiveDays < 14) return { emoji: '💪', label: 'Week Warrior' };
  if (consecutiveDays < 30) return { emoji: '⚡', label: 'Fortnight Force' };
  return { emoji: '👑', label: 'Monthly Master' };
}

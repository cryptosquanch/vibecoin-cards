import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type UserLevel,
  type XPSource,
  calculateLevel,
  XP_REWARDS,
  calculateXPWithMultipliers,
} from '@/lib/leveling';

interface XPHistoryEntry {
  source: XPSource;
  amount: number;
  timestamp: string;
  description?: string;
}

interface LevelingState {
  // Core state
  totalXP: number;
  level: UserLevel;
  prestige: number;

  // History (last 50 entries)
  xpHistory: XPHistoryEntry[];

  // Actions
  addXP: (source: XPSource, multipliers?: { stakingMultiplier?: number; streakBonus?: number; eventMultiplier?: number }, description?: string) => number;
  addCustomXP: (amount: number, source: string, description?: string) => void;
  setTotalXP: (xp: number) => void;

  // Getters
  getRecentXP: (days?: number) => number;
}

export const useLevelingStore = create<LevelingState>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      level: calculateLevel(0),
      prestige: 0,
      xpHistory: [],

      addXP: (source: XPSource, multipliers = {}, description?: string) => {
        const state = get();
        const baseXP = XP_REWARDS[source];
        const finalXP = calculateXPWithMultipliers(baseXP, multipliers);

        const newTotalXP = state.totalXP + finalXP;
        const newLevel = calculateLevel(newTotalXP);

        // Check for level up
        const leveledUp = newLevel.level > state.level.level;

        // Add to history
        const historyEntry: XPHistoryEntry = {
          source,
          amount: finalXP,
          timestamp: new Date().toISOString(),
          description,
        };

        // Keep only last 50 entries
        const newHistory = [historyEntry, ...state.xpHistory].slice(0, 50);

        set({
          totalXP: newTotalXP,
          level: newLevel,
          prestige: newLevel.prestige,
          xpHistory: newHistory,
        });

        return finalXP;
      },

      addCustomXP: (amount: number, source: string, description?: string) => {
        const state = get();
        const newTotalXP = state.totalXP + amount;
        const newLevel = calculateLevel(newTotalXP);

        const historyEntry: XPHistoryEntry = {
          source: source as XPSource,
          amount,
          timestamp: new Date().toISOString(),
          description,
        };

        const newHistory = [historyEntry, ...state.xpHistory].slice(0, 50);

        set({
          totalXP: newTotalXP,
          level: newLevel,
          prestige: newLevel.prestige,
          xpHistory: newHistory,
        });
      },

      setTotalXP: (xp: number) => {
        const newLevel = calculateLevel(xp);
        set({
          totalXP: xp,
          level: newLevel,
          prestige: newLevel.prestige,
        });
      },

      getRecentXP: (days: number = 7) => {
        const state = get();
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        return state.xpHistory
          .filter(entry => entry.timestamp >= cutoff)
          .reduce((sum, entry) => sum + entry.amount, 0);
      },
    }),
    {
      name: 'vibecoin-leveling',
    }
  )
);

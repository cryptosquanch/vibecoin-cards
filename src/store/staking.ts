import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type StakingTier,
  type LockDuration,
  type StakingPosition,
  calculateStakingPosition,
  getStakingTier,
} from '@/lib/staking';

interface StakingState {
  // Core state
  stakedAmount: number;
  lockDuration: LockDuration;
  lockedAt: string | null;
  position: StakingPosition | null;

  // Stats
  stakingStreak: number; // Days continuously staked
  totalFeesSaved: number;
  totalBonusXPEarned: number;
  stakingHistory: StakingHistoryEntry[];

  // Actions
  stake: (amount: number, duration: LockDuration) => void;
  unstake: () => boolean; // Returns false if locked
  addToStake: (amount: number) => void;
  updateStats: (feesSaved: number, bonusXP: number) => void;

  // Getters
  canUnstake: () => boolean;
  getCurrentTier: () => StakingTier;
  getXPMultiplier: () => number;
  getFeeDiscount: () => number;
}

interface StakingHistoryEntry {
  action: 'stake' | 'unstake' | 'add';
  amount: number;
  timestamp: string;
  tier?: StakingTier;
}

export const useStakingStore = create<StakingState>()(
  persist(
    (set, get) => ({
      stakedAmount: 0,
      lockDuration: 'none',
      lockedAt: null,
      position: null,
      stakingStreak: 0,
      totalFeesSaved: 0,
      totalBonusXPEarned: 0,
      stakingHistory: [],

      stake: (amount: number, duration: LockDuration) => {
        const now = new Date().toISOString();
        const position = calculateStakingPosition(amount, duration, now);

        const historyEntry: StakingHistoryEntry = {
          action: 'stake',
          amount,
          timestamp: now,
          tier: position.tier,
        };

        set(state => ({
          stakedAmount: amount,
          lockDuration: duration,
          lockedAt: duration !== 'none' ? now : null,
          position,
          stakingHistory: [historyEntry, ...state.stakingHistory].slice(0, 50),
        }));
      },

      unstake: () => {
        const state = get();

        // Check if locked
        if (state.position?.isLocked) {
          return false;
        }

        const historyEntry: StakingHistoryEntry = {
          action: 'unstake',
          amount: state.stakedAmount,
          timestamp: new Date().toISOString(),
        };

        set(prevState => ({
          stakedAmount: 0,
          lockDuration: 'none',
          lockedAt: null,
          position: null,
          // Reset streak on unstake
          stakingStreak: 0,
          stakingHistory: [historyEntry, ...prevState.stakingHistory].slice(0, 50),
        }));

        return true;
      },

      addToStake: (amount: number) => {
        const state = get();
        const newAmount = state.stakedAmount + amount;
        const position = calculateStakingPosition(
          newAmount,
          state.lockDuration,
          state.lockedAt || undefined
        );

        const historyEntry: StakingHistoryEntry = {
          action: 'add',
          amount,
          timestamp: new Date().toISOString(),
          tier: position.tier,
        };

        set(prevState => ({
          stakedAmount: newAmount,
          position,
          stakingHistory: [historyEntry, ...prevState.stakingHistory].slice(0, 50),
        }));
      },

      updateStats: (feesSaved: number, bonusXP: number) => {
        set(state => ({
          totalFeesSaved: state.totalFeesSaved + feesSaved,
          totalBonusXPEarned: state.totalBonusXPEarned + bonusXP,
        }));
      },

      canUnstake: () => {
        const state = get();
        return !state.position?.isLocked;
      },

      getCurrentTier: () => {
        const state = get();
        return state.position?.tier || 'none';
      },

      getXPMultiplier: () => {
        const state = get();
        return state.position?.rewards.xpMultiplier || 1.0;
      },

      getFeeDiscount: () => {
        const state = get();
        return state.position?.rewards.feeDiscount || 0;
      },
    }),
    {
      name: 'vibecoin-staking',
    }
  )
);

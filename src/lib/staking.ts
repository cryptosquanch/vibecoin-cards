/**
 * $VIBE Staking System
 *
 * Features:
 * 1. Four staking tiers (Bronze, Silver, Gold, Platinum)
 * 2. Fee discounts based on stake amount
 * 3. XP multipliers for stakers
 * 4. Lock duration options with bonuses
 * 5. Staking streaks
 */

export type StakingTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
export type LockDuration = 'none' | '7d' | '30d' | '90d';

export interface StakingTierConfig {
  tier: StakingTier;
  name: string;
  minStake: number;
  feeDiscount: number; // Percentage
  xpMultiplier: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
}

export interface LockDurationConfig {
  duration: LockDuration;
  label: string;
  days: number;
  bonusMultiplier: number; // Extra multiplier on top of tier benefits
  description: string;
}

export interface StakingPosition {
  amount: number;
  tier: StakingTier;
  lockDuration: LockDuration;
  lockedAt?: string;
  unlocksAt?: string;
  isLocked: boolean;
  rewards: {
    feeDiscount: number;
    xpMultiplier: number;
    totalBonus: number;
  };
}

export interface StakingStats {
  totalStaked: number;
  currentTier: StakingTier;
  stakingStreak: number; // Days continuously staked
  totalFeesSaved: number;
  totalBonusXPEarned: number;
  position?: StakingPosition;
}

// Tier configurations
export const STAKING_TIERS: StakingTierConfig[] = [
  {
    tier: 'none',
    name: 'No Stake',
    minStake: 0,
    feeDiscount: 0,
    xpMultiplier: 1.0,
    icon: '⭕',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    benefits: ['Basic trading access'],
  },
  {
    tier: 'bronze',
    name: 'Bronze',
    minStake: 100,
    feeDiscount: 5,
    xpMultiplier: 1.1,
    icon: '🥉',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    benefits: ['5% fee discount', '1.1x XP multiplier', 'Bronze badge'],
  },
  {
    tier: 'silver',
    name: 'Silver',
    minStake: 500,
    feeDiscount: 10,
    xpMultiplier: 1.25,
    icon: '🥈',
    color: 'text-gray-600',
    bgColor: 'bg-gray-200',
    borderColor: 'border-gray-400',
    benefits: ['10% fee discount', '1.25x XP multiplier', 'Silver badge', 'Priority support'],
  },
  {
    tier: 'gold',
    name: 'Gold',
    minStake: 1000,
    feeDiscount: 15,
    xpMultiplier: 1.5,
    icon: '🥇',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    benefits: ['15% fee discount', '1.5x XP multiplier', 'Gold badge', 'Early access to features', 'Exclusive airdrops'],
  },
  {
    tier: 'platinum',
    name: 'Platinum',
    minStake: 5000,
    feeDiscount: 25,
    xpMultiplier: 2.0,
    icon: '💎',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-400',
    benefits: [
      '25% fee discount',
      '2x XP multiplier',
      'Platinum badge',
      'VIP support',
      'Governance voting',
      'Premium tournaments',
      'Exclusive card backs',
    ],
  },
];

// Lock duration configurations
export const LOCK_DURATIONS: LockDurationConfig[] = [
  {
    duration: 'none',
    label: 'No Lock',
    days: 0,
    bonusMultiplier: 1.0,
    description: 'Unstake anytime, no bonus',
  },
  {
    duration: '7d',
    label: '7 Days',
    days: 7,
    bonusMultiplier: 1.1,
    description: '+10% bonus on all benefits',
  },
  {
    duration: '30d',
    label: '30 Days',
    days: 30,
    bonusMultiplier: 1.25,
    description: '+25% bonus on all benefits',
  },
  {
    duration: '90d',
    label: '90 Days',
    days: 90,
    bonusMultiplier: 1.5,
    description: '+50% bonus on all benefits',
  },
];

// Get tier for stake amount
export function getStakingTier(amount: number): StakingTierConfig {
  // Reverse order to find highest matching tier
  for (let i = STAKING_TIERS.length - 1; i >= 0; i--) {
    if (amount >= STAKING_TIERS[i].minStake) {
      return STAKING_TIERS[i];
    }
  }
  return STAKING_TIERS[0];
}

// Get tier config by tier name
export function getTierConfig(tier: StakingTier): StakingTierConfig {
  return STAKING_TIERS.find(t => t.tier === tier) || STAKING_TIERS[0];
}

// Get lock duration config
export function getLockConfig(duration: LockDuration): LockDurationConfig {
  return LOCK_DURATIONS.find(l => l.duration === duration) || LOCK_DURATIONS[0];
}

// Calculate staking position with all bonuses
export function calculateStakingPosition(
  amount: number,
  lockDuration: LockDuration,
  lockedAt?: string
): StakingPosition {
  const tierConfig = getStakingTier(amount);
  const lockConfig = getLockConfig(lockDuration);

  const baseFeeDiscount = tierConfig.feeDiscount;
  const baseXpMultiplier = tierConfig.xpMultiplier;

  // Apply lock bonus
  const feeDiscount = Math.round(baseFeeDiscount * lockConfig.bonusMultiplier);
  const xpMultiplier = Math.round(baseXpMultiplier * lockConfig.bonusMultiplier * 100) / 100;

  let unlocksAt: string | undefined;
  let isLocked = false;

  if (lockedAt && lockDuration !== 'none') {
    const lockedDate = new Date(lockedAt);
    const unlockDate = new Date(lockedDate.getTime() + lockConfig.days * 24 * 60 * 60 * 1000);
    unlocksAt = unlockDate.toISOString();
    isLocked = new Date() < unlockDate;
  }

  return {
    amount,
    tier: tierConfig.tier,
    lockDuration,
    lockedAt,
    unlocksAt,
    isLocked,
    rewards: {
      feeDiscount,
      xpMultiplier,
      totalBonus: Math.round((xpMultiplier - 1) * 100),
    },
  };
}

// Calculate time remaining until unlock
export function getTimeUntilUnlock(unlocksAt: string): { days: number; hours: number; minutes: number } | null {
  const unlockDate = new Date(unlocksAt);
  const now = new Date();

  if (now >= unlockDate) return null;

  const diff = unlockDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

// Format time remaining
export function formatUnlockTime(time: { days: number; hours: number; minutes: number }): string {
  if (time.days > 0) {
    return `${time.days}d ${time.hours}h`;
  }
  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  }
  return `${time.minutes}m`;
}

// Calculate potential rewards for different tiers (for display)
export function calculatePotentialRewards(
  amount: number
): { tier: StakingTier; feeDiscount: number; xpMultiplier: number; additionalStakeNeeded: number }[] {
  return STAKING_TIERS.filter(t => t.tier !== 'none').map(tier => ({
    tier: tier.tier,
    feeDiscount: tier.feeDiscount,
    xpMultiplier: tier.xpMultiplier,
    additionalStakeNeeded: Math.max(0, tier.minStake - amount),
  }));
}

// Staking streak bonuses
export function getStreakBonus(streakDays: number): { bonus: number; label: string } {
  if (streakDays < 7) return { bonus: 0, label: 'No bonus' };
  if (streakDays < 30) return { bonus: 5, label: '1 Week+' };
  if (streakDays < 90) return { bonus: 10, label: '1 Month+' };
  if (streakDays < 180) return { bonus: 15, label: '3 Months+' };
  if (streakDays < 365) return { bonus: 20, label: '6 Months+' };
  return { bonus: 30, label: '1 Year+' };
}

// Calculate APY estimate (for display purposes)
export function estimateAPY(tier: StakingTier, lockDuration: LockDuration): number {
  const tierConfig = getTierConfig(tier);
  const lockConfig = getLockConfig(lockDuration);

  // Base APY per tier (hypothetical)
  const baseAPY: Record<StakingTier, number> = {
    none: 0,
    bronze: 5,
    silver: 8,
    gold: 12,
    platinum: 18,
  };

  return Math.round(baseAPY[tier] * lockConfig.bonusMultiplier * 10) / 10;
}

// Get next tier info
export function getNextTier(currentTier: StakingTier): StakingTierConfig | null {
  const currentIndex = STAKING_TIERS.findIndex(t => t.tier === currentTier);
  if (currentIndex === -1 || currentIndex >= STAKING_TIERS.length - 1) return null;
  return STAKING_TIERS[currentIndex + 1];
}

// Calculate amount needed for next tier
export function getAmountToNextTier(currentAmount: number): number {
  const currentTier = getStakingTier(currentAmount);
  const nextTier = getNextTier(currentTier.tier);
  if (!nextTier) return 0;
  return Math.max(0, nextTier.minStake - currentAmount);
}

// Format $VIBE amount
export function formatVibeAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return amount.toLocaleString();
}

// Mock staking stats for demo
export const MOCK_STAKING_STATS: StakingStats = {
  totalStaked: 750,
  currentTier: 'silver',
  stakingStreak: 45,
  totalFeesSaved: 127.50,
  totalBonusXPEarned: 2340,
  position: calculateStakingPosition(750, '30d', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()),
};

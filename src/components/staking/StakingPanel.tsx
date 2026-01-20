'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStakingStore } from '@/store';
import {
  STAKING_TIERS,
  LOCK_DURATIONS,
  type StakingTier,
  type LockDuration,
  getTimeUntilUnlock,
  formatUnlockTime,
  getNextTier,
  getAmountToNextTier,
  formatVibeAmount,
  estimateAPY,
  getStreakBonus,
} from '@/lib/staking';

interface StakingPanelProps {
  className?: string;
  vibeBalance?: number; // User's available $VIBE balance
}

export function StakingPanel({ className = '', vibeBalance = 10000 }: StakingPanelProps) {
  const {
    stakedAmount,
    position,
    stakingStreak,
    totalFeesSaved,
    totalBonusXPEarned,
    stake,
    unstake,
    addToStake,
    canUnstake,
    getCurrentTier,
    getXPMultiplier,
    getFeeDiscount,
  } = useStakingStore();

  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<LockDuration>('none');
  const [showStakeModal, setShowStakeModal] = useState(false);

  const currentTier = getCurrentTier();
  const tierConfig = STAKING_TIERS.find(t => t.tier === currentTier) || STAKING_TIERS[0];
  const nextTier = getNextTier(currentTier);
  const amountToNext = getAmountToNextTier(stakedAmount);
  const unlockTime = position?.unlocksAt ? getTimeUntilUnlock(position.unlocksAt) : null;
  const streakBonus = getStreakBonus(stakingStreak);

  const handleStake = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (stakedAmount > 0) {
      addToStake(amount);
    } else {
      stake(amount, selectedDuration);
    }

    setStakeAmount('');
    setShowStakeModal(false);
  };

  const handleUnstake = () => {
    if (canUnstake()) {
      unstake();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Position */}
      <div className="surface-panel">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="heading-3">$VIBE Staking</h3>
            <p className="text-sm text-muted">Stake to earn discounts and XP boosts</p>
          </div>
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${tierConfig.bgColor} ${tierConfig.borderColor} border`}>
            <span className="text-2xl">{tierConfig.icon}</span>
            <div>
              <p className={`font-bold ${tierConfig.color}`}>{tierConfig.name}</p>
              <p className="text-xs text-muted">Current Tier</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-botanical-50 rounded-xl text-center">
            <p className="text-2xl font-bold">{formatVibeAmount(stakedAmount)}</p>
            <p className="text-xs text-muted">$VIBE Staked</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{getFeeDiscount()}%</p>
            <p className="text-xs text-muted">Fee Discount</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-600">{getXPMultiplier()}x</p>
            <p className="text-xs text-muted">XP Multiplier</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-orange-600">{stakingStreak}</p>
            <p className="text-xs text-muted">Day Streak</p>
          </div>
        </div>

        {/* Lock Status */}
        {position?.isLocked && unlockTime && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-medium">Position Locked</p>
                  <p className="text-sm text-muted">
                    {LOCK_DURATIONS.find(l => l.duration === position.lockDuration)?.label} lock
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-700">{formatUnlockTime(unlockTime)}</p>
                <p className="text-xs text-muted">Until unlock</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Tier Progress */}
        {nextTier && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Progress to {nextTier.name}</span>
              <span className="text-sm font-medium">
                {formatVibeAmount(amountToNext)} more needed
              </span>
            </div>
            <div className="h-3 bg-botanical-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${nextTier.bgColor.replace('bg-', 'bg-')}`}
                style={{
                  background: nextTier.tier === 'platinum' ? 'linear-gradient(to right, #22d3ee, #06b6d4)' : undefined,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stakedAmount / nextTier.minStake) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowStakeModal(true)}
            className="flex-1 btn btn-primary"
          >
            {stakedAmount > 0 ? 'Add More' : 'Stake $VIBE'}
          </button>
          {stakedAmount > 0 && (
            <button
              onClick={handleUnstake}
              disabled={position?.isLocked}
              className={`flex-1 btn ${
                position?.isLocked
                  ? 'btn-secondary opacity-50 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              {position?.isLocked ? '🔒 Locked' : 'Unstake'}
            </button>
          )}
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="surface-panel">
        <h3 className="heading-3 mb-4">Staking Tiers</h3>
        <div className="grid gap-3">
          {STAKING_TIERS.filter(t => t.tier !== 'none').map(tier => {
            const isCurrentTier = tier.tier === currentTier;
            const isUnlocked = stakedAmount >= tier.minStake;

            return (
              <div
                key={tier.tier}
                className={`p-4 rounded-xl border transition-colors ${
                  isCurrentTier
                    ? `${tier.bgColor} ${tier.borderColor} ring-2 ring-offset-2`
                    : isUnlocked
                    ? `${tier.bgColor} ${tier.borderColor}`
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <p className={`font-bold ${tier.color}`}>{tier.name}</p>
                      <p className="text-xs text-muted">{formatVibeAmount(tier.minStake)}+ $VIBE</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{tier.feeDiscount}% discount</p>
                    <p className="text-sm text-muted">{tier.xpMultiplier}x XP</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tier.benefits.slice(0, 3).map((benefit, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-white/50 rounded">
                      {benefit}
                    </span>
                  ))}
                  {tier.benefits.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-muted">
                      +{tier.benefits.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold text-green-600">${totalFeesSaved.toFixed(2)}</p>
          <p className="text-sm text-muted">Total Fees Saved</p>
        </div>
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold text-purple-600">{totalBonusXPEarned.toLocaleString()}</p>
          <p className="text-sm text-muted">Bonus XP Earned</p>
        </div>
      </div>

      {/* Stake Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="heading-3">Stake $VIBE</h3>
              <button onClick={() => setShowStakeModal(false)} className="text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-sm text-muted mb-2 block">Amount to Stake</label>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-botanical-200 rounded-xl text-lg font-semibold"
                />
                <button
                  onClick={() => setStakeAmount(vibeBalance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-botanical-600 hover:underline"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-muted mt-1">
                Available: {formatVibeAmount(vibeBalance)} $VIBE
              </p>
            </div>

            {/* Lock Duration */}
            {stakedAmount === 0 && (
              <div className="mb-6">
                <label className="text-sm text-muted mb-2 block">Lock Duration (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCK_DURATIONS.map(lock => (
                    <button
                      key={lock.duration}
                      onClick={() => setSelectedDuration(lock.duration)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        selectedDuration === lock.duration
                          ? 'bg-botanical-100 border-botanical-500'
                          : 'border-botanical-200 hover:border-botanical-300'
                      }`}
                    >
                      <p className="font-medium">{lock.label}</p>
                      <p className="text-xs text-muted">{lock.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {stakeAmount && parseFloat(stakeAmount) > 0 && (
              <div className="p-4 bg-botanical-50 rounded-xl mb-6">
                <p className="text-sm text-muted mb-2">You will receive:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-bold text-green-600">
                      {STAKING_TIERS.find(t =>
                        (stakedAmount + parseFloat(stakeAmount)) >= t.minStake
                      )?.feeDiscount || 0}%
                    </p>
                    <p className="text-xs text-muted">Fee Discount</p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-600">
                      {STAKING_TIERS.find(t =>
                        (stakedAmount + parseFloat(stakeAmount)) >= t.minStake
                      )?.xpMultiplier || 1}x
                    </p>
                    <p className="text-xs text-muted">XP Multiplier</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
              className="w-full btn btn-primary"
            >
              {stakedAmount > 0 ? 'Add to Stake' : 'Stake Now'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default StakingPanel;

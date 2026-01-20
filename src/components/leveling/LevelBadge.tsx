'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLevelingStore } from '@/store';
import {
  type UserLevel,
  type LevelTier,
  getLevelProgress,
  getXPToNextLevel,
  getTierColor,
  getTierBgColor,
  getTierIcon,
  getPrestigeBadge,
  formatXP,
  getLevelInfo,
  getUnlocksUpToLevel,
} from '@/lib/leveling';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * LevelBadge uses tier-based visual styling:
 * - Bronze/Silver/Gold/Legend have distinct colors
 * - Progress ring SVG shows % to next level
 * - Prestige badge indicates multiple 50+ completions
 * - Pulse animation highlights level-up milestones
 *
 * Enhanced with Framer Motion for smooth transitions.
 * ─────────────────────────────────────────────────
 */

interface LevelBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showXP?: boolean;
  className?: string;
}

export function LevelBadge({
  size = 'md',
  showProgress = true,
  showXP = true,
  className = '',
}: LevelBadgeProps) {
  const { level, totalXP } = useLevelingStore();

  const progress = getLevelProgress(level);
  const xpToNext = getXPToNextLevel(level);
  const prestigeBadge = getPrestigeBadge(level.prestige);

  const sizeConfig = {
    sm: { badge: 'w-8 h-8 text-sm', text: 'text-xs', icon: 'text-base' },
    md: { badge: 'w-12 h-12 text-lg', text: 'text-sm', icon: 'text-xl' },
    lg: { badge: 'w-16 h-16 text-2xl', text: 'text-base', icon: 'text-3xl' },
  };

  const config = sizeConfig[size];

  // Tier-based glow for special effects
  const tierGlow = level.tier === 'Grandmaster' || level.tier === 'Legend' ? 'shadow-yellow-300/50' :
                   level.tier === 'Master' || level.tier === 'Expert' ? 'shadow-purple-200/40' :
                   level.tier === 'Journeyman' ? 'shadow-blue-200/40' : '';

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Level Badge */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className={`${config.badge} ${getTierBgColor(level.tier)} rounded-full flex items-center justify-center font-bold shadow-lg ${tierGlow}`}
          animate={(level.tier === 'Legend' || level.tier === 'Grandmaster') ? {
            boxShadow: [
              '0 0 15px rgba(234, 179, 8, 0.3)',
              '0 0 25px rgba(234, 179, 8, 0.5)',
              '0 0 15px rgba(234, 179, 8, 0.3)',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {level.level}
        </motion.div>

        {/* Prestige indicator */}
        {prestigeBadge && (
          <div className="absolute -top-1 -right-1 text-sm">
            {prestigeBadge.icon}
          </div>
        )}

        {/* Progress ring (for md and lg) */}
        {showProgress && size !== 'sm' && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 36 36"
          >
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              className={getTierColor(level.tier)}
            />
          </svg>
        )}
      </motion.div>

      {/* Text info */}
      <AnimatePresence mode="wait">
        {(showProgress || showXP) && (
          <motion.div
            key={level.level}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${config.text} ${getTierColor(level.tier)}`}>
                {getTierIcon(level.tier)} {level.tier}
              </span>
              {prestigeBadge && (
                <motion.span
                  className={`${config.text} ${prestigeBadge.color}`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {prestigeBadge.label}
                </motion.span>
              )}
            </div>
            {showXP && (
              <p className={`text-muted ${config.text}`}>
                {formatXP(totalXP)} XP
                {level.level < 50 && ` · ${formatXP(xpToNext)} to next`}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface LevelProgressCardProps {
  className?: string;
}

export function LevelProgressCard({ className = '' }: LevelProgressCardProps) {
  const { level, totalXP, xpHistory, getRecentXP } = useLevelingStore();

  const progress = getLevelProgress(level);
  const xpToNext = getXPToNextLevel(level);
  const levelInfo = getLevelInfo(level.level);
  const nextLevelInfo = getLevelInfo(level.level + 1);
  const recentXP = getRecentXP(7);
  const prestigeBadge = getPrestigeBadge(level.prestige);

  return (
    <div className={`surface-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 ${getTierBgColor(level.tier)} rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg`}>
            {level.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`heading-3 ${getTierColor(level.tier)}`}>
                {getTierIcon(level.tier)} {level.tier}
              </h3>
              {prestigeBadge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prestigeBadge.color} bg-white`}>
                  {prestigeBadge.icon} {prestigeBadge.label}
                </span>
              )}
            </div>
            <p className="text-muted">Level {level.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{formatXP(totalXP)}</p>
          <p className="text-sm text-muted">Total XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Level {level.level}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
          <span className="text-muted">Level {level.level + 1}</span>
        </div>
        <div className="h-4 bg-botanical-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              level.tier === 'Legend'
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                : 'bg-botanical-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted mt-1 text-center">
          {formatXP(xpToNext)} XP until Level {level.level + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-botanical-50 rounded-xl">
          <p className="text-lg font-bold text-botanical-600">{formatXP(recentXP)}</p>
          <p className="text-xs text-muted">This Week</p>
        </div>
        <div className="text-center p-3 bg-botanical-50 rounded-xl">
          <p className="text-lg font-bold text-botanical-600">{xpHistory.length}</p>
          <p className="text-xs text-muted">Actions</p>
        </div>
        <div className="text-center p-3 bg-botanical-50 rounded-xl">
          <p className="text-lg font-bold text-botanical-600">
            {nextLevelInfo ? formatXP(nextLevelInfo.xpRequired) : '∞'}
          </p>
          <p className="text-xs text-muted">XP Needed</p>
        </div>
      </div>

      {/* Next Unlock */}
      {nextLevelInfo && nextLevelInfo.unlocks.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            🎁 Unlock at Level {level.level + 1}:
          </p>
          <div className="flex flex-wrap gap-2">
            {nextLevelInfo.unlocks.map((unlock, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-yellow-100 rounded">
                {unlock}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent XP History */}
      {xpHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-muted mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {xpHistory.slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-botanical-50 rounded-lg">
                <span className="text-muted capitalize">
                  {entry.source.replace(/_/g, ' ')}
                </span>
                <span className="font-medium text-botanical-600">+{entry.amount} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LevelBadge;

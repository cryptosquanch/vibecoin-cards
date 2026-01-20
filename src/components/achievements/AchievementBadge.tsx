'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Achievement badges use rarity-based styling:
 * - Common: Gray border, subtle glow
 * - Rare: Blue border, pulse animation
 * - Epic: Purple border, shimmer effect
 * - Legendary: Gold border, continuous glow
 *
 * Share functionality generates OG-image-ready text
 * for Twitter/X, with achievement details encoded.
 * ─────────────────────────────────────────────────
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'trading' | 'collection' | 'social' | 'creator' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onShare?: (achievement: Achievement) => void;
  onClick?: (achievement: Achievement) => void;
}

const RARITY_CONFIG: Record<AchievementRarity, {
  border: string;
  bg: string;
  glow: string;
  text: string;
  label: string;
}> = {
  common: {
    border: 'border-gray-300',
    bg: 'bg-gray-100',
    glow: '',
    text: 'text-gray-600',
    label: 'Common',
  },
  rare: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    glow: 'shadow-blue-200',
    text: 'text-blue-600',
    label: 'Rare',
  },
  epic: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    glow: 'shadow-purple-200',
    text: 'text-purple-600',
    label: 'Epic',
  },
  legendary: {
    border: 'border-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    glow: 'shadow-yellow-300',
    text: 'text-yellow-600',
    label: 'Legendary',
  },
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  trading: '💹',
  collection: '🃏',
  social: '👥',
  creator: '🚀',
  special: '✨',
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showProgress = false,
  onShare,
  onClick,
}: AchievementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = RARITY_CONFIG[achievement.rarity];

  const sizeConfig = {
    sm: { badge: 'w-12 h-12', emoji: 'text-xl', text: 'text-xs' },
    md: { badge: 'w-16 h-16', emoji: 'text-3xl', text: 'text-sm' },
    lg: { badge: 'w-24 h-24', emoji: 'text-5xl', text: 'text-base' },
  };

  const sizes = sizeConfig[size];

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Badge */}
      <motion.button
        onClick={() => onClick?.(achievement)}
        className={`
          ${sizes.badge} rounded-2xl border-2 ${config.border} ${config.bg}
          flex items-center justify-center relative overflow-hidden
          ${achievement.unlocked ? `shadow-lg ${config.glow}` : 'opacity-40 grayscale'}
          transition-all cursor-pointer
        `}
        animate={achievement.unlocked && achievement.rarity === 'legendary' ? {
          boxShadow: [
            '0 0 20px rgba(251, 191, 36, 0.3)',
            '0 0 40px rgba(251, 191, 36, 0.5)',
            '0 0 20px rgba(251, 191, 36, 0.3)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Shimmer effect for epic+ */}
        {achievement.unlocked && (achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <span className={sizes.emoji}>{achievement.emoji}</span>

        {/* Lock overlay */}
        {!achievement.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <span className="text-lg">🔒</span>
          </div>
        )}

        {/* Progress ring */}
        {showProgress && !achievement.unlocked && achievement.progress !== undefined && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${achievement.progress * 2.83} 283`}
              className={config.text}
            />
          </svg>
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-white rounded-xl shadow-xl border"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">{achievement.emoji}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{achievement.name}</h4>
                <span className={`text-xs ${config.text}`}>{config.label}</span>
              </div>
            </div>
            <p className="text-xs text-muted mb-2">{achievement.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-botanical-600">+{achievement.xpReward} XP</span>
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="text-muted">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </span>
              )}
              {!achievement.unlocked && achievement.progress !== undefined && (
                <span className="text-muted">{achievement.progress}%</span>
              )}
            </div>

            {/* Share button */}
            {achievement.unlocked && onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(achievement);
                }}
                className="mt-2 w-full py-1.5 bg-botanical-100 hover:bg-botanical-200 rounded-lg text-xs font-medium transition-colors"
              >
                📤 Share Achievement
              </button>
            )}

            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Share modal component
interface ShareAchievementModalProps {
  achievement: Achievement;
  username?: string;
  onClose: () => void;
}

export function ShareAchievementModal({ achievement, username, onClose }: ShareAchievementModalProps) {
  const config = RARITY_CONFIG[achievement.rarity];

  const shareText = `🏆 I just unlocked "${achievement.name}" on VibeCoin!

${achievement.emoji} ${achievement.description}

+${achievement.xpReward} XP earned!

#VibeCoin #Web3Gaming #Achievement`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareText);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Achievement Preview */}
        <div className={`${config.bg} rounded-xl p-6 mb-6 text-center`}>
          <motion.div
            className="text-6xl mb-3"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            {achievement.emoji}
          </motion.div>
          <h3 className="text-xl font-bold mb-1">{achievement.name}</h3>
          <p className={`text-sm ${config.text} mb-2`}>{config.label} Achievement</p>
          <p className="text-sm text-muted">{achievement.description}</p>
          <div className="mt-3 inline-block px-3 py-1 bg-white/50 rounded-full text-sm font-medium text-botanical-600">
            +{achievement.xpReward} XP
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <button
            onClick={shareToTwitter}
            className="w-full py-3 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>

          <button
            onClick={copyToClipboard}
            className="w-full py-3 bg-botanical-100 text-botanical-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-botanical-200 transition-colors"
          >
            📋 Copy to Clipboard
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AchievementBadge;

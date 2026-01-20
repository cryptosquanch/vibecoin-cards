'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AchievementBadge,
  ShareAchievementModal,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
} from './AchievementBadge';

// Mock achievements data
const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Trading
  { id: '1', name: 'First Blood', description: 'Complete your first trade', emoji: '🎯', category: 'trading', rarity: 'common', xpReward: 25, unlocked: true, unlockedAt: '2025-01-15T10:00:00Z' },
  { id: '2', name: 'Diamond Hands', description: 'Hold a token for 7+ days', emoji: '💎', category: 'trading', rarity: 'rare', xpReward: 50, unlocked: true, unlockedAt: '2025-01-18T14:30:00Z' },
  { id: '3', name: 'Whale Alert', description: 'Hold >$10K in a single token', emoji: '🐋', category: 'trading', rarity: 'epic', xpReward: 100, unlocked: false, progress: 45 },
  { id: '4', name: 'Diversifier', description: 'Hold tokens from all 4 categories', emoji: '🌈', category: 'trading', rarity: 'rare', xpReward: 50, unlocked: true, unlockedAt: '2025-01-19T09:15:00Z' },

  // Collection
  { id: '5', name: 'Card Shark', description: 'Get a Flush or better hand', emoji: '🃏', category: 'collection', rarity: 'rare', xpReward: 50, unlocked: true, unlockedAt: '2025-01-17T16:00:00Z' },
  { id: '6', name: 'Royal Treatment', description: 'Achieve a Royal Flush', emoji: '👑', category: 'collection', rarity: 'legendary', xpReward: 250, unlocked: false, progress: 20 },
  { id: '7', name: 'Set Collector', description: 'Complete 1 collection', emoji: '📦', category: 'collection', rarity: 'rare', xpReward: 50, unlocked: false, progress: 75 },
  { id: '8', name: 'Completionist', description: 'Complete all 8 collections', emoji: '🏆', category: 'collection', rarity: 'legendary', xpReward: 250, unlocked: false, progress: 12 },

  // Social
  { id: '9', name: 'Early Adopter', description: 'Buy token in first 24h of launch', emoji: '🌟', category: 'social', rarity: 'rare', xpReward: 50, unlocked: true, unlockedAt: '2025-01-16T08:00:00Z' },
  { id: '10', name: 'Trendsetter', description: 'Hold 3 tokens that later hit top 10', emoji: '🔥', category: 'social', rarity: 'epic', xpReward: 100, unlocked: false, progress: 33 },
  { id: '11', name: 'Smart Money', description: 'Buy token before 10x gain', emoji: '📈', category: 'social', rarity: 'epic', xpReward: 100, unlocked: false, progress: 0 },

  // Creator
  { id: '12', name: 'Launcher', description: 'Launch your first token', emoji: '🚀', category: 'creator', rarity: 'common', xpReward: 25, unlocked: false, progress: 0 },
  { id: '13', name: 'Graduate', description: 'Token reaches $69K market cap', emoji: '🎓', category: 'creator', rarity: 'epic', xpReward: 100, unlocked: false, progress: 0 },
  { id: '14', name: 'Community Builder', description: 'Token reaches 1000 holders', emoji: '👥', category: 'creator', rarity: 'epic', xpReward: 100, unlocked: false, progress: 0 },
  { id: '15', name: 'Revenue King', description: 'Earn $1000+ in creator fees', emoji: '💰', category: 'creator', rarity: 'legendary', xpReward: 250, unlocked: false, progress: 0 },

  // Special
  { id: '16', name: 'Night Owl', description: 'Trade between 2-5 AM local time', emoji: '🌙', category: 'special', rarity: 'rare', xpReward: 50, unlocked: false, progress: 0 },
];

interface AchievementDisplayProps {
  achievements?: Achievement[];
  showFilters?: boolean;
  compact?: boolean;
  className?: string;
}

export function AchievementDisplay({
  achievements = MOCK_ACHIEVEMENTS,
  showFilters = true,
  compact = false,
  className = '',
}: AchievementDisplayProps) {
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [shareAchievement, setShareAchievement] = useState<Achievement | null>(null);

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false;
      if (showUnlockedOnly && !a.unlocked) return false;
      return true;
    });
  }, [achievements, categoryFilter, rarityFilter, showUnlockedOnly]);

  const stats = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    const xpEarned = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    return { unlocked, total, xpEarned, progress: Math.round((unlocked / total) * 100) };
  }, [achievements]);

  const categories: { id: AchievementCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🎖️' },
    { id: 'trading', label: 'Trading', icon: '💹' },
    { id: 'collection', label: 'Collection', icon: '🃏' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'creator', label: 'Creator', icon: '🚀' },
    { id: 'special', label: 'Special', icon: '✨' },
  ];

  const rarities: { id: AchievementRarity | 'all'; label: string }[] = [
    { id: 'all', label: 'All Rarities' },
    { id: 'common', label: 'Common' },
    { id: 'rare', label: 'Rare' },
    { id: 'epic', label: 'Epic' },
    { id: 'legendary', label: 'Legendary' },
  ];

  return (
    <div className={className}>
      {/* Stats Header */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="text-center p-4 bg-botanical-50 rounded-xl">
            <p className="text-3xl font-bold text-botanical-600">
              {stats.unlocked}/{stats.total}
            </p>
            <p className="text-sm text-muted">Unlocked</p>
          </div>
          <div className="text-center p-4 bg-botanical-50 rounded-xl">
            <p className="text-3xl font-bold text-botanical-600">{stats.progress}%</p>
            <p className="text-sm text-muted">Complete</p>
          </div>
          <div className="text-center p-4 bg-botanical-50 rounded-xl">
            <p className="text-3xl font-bold text-botanical-600">+{stats.xpEarned}</p>
            <p className="text-sm text-muted">XP Earned</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3 mb-6">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-botanical-500 text-white'
                    : 'bg-botanical-100 hover:bg-botanical-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary filters */}
          <div className="flex items-center gap-4">
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as AchievementRarity | 'all')}
              className="px-3 py-1.5 bg-botanical-50 border border-botanical-200 rounded-lg text-sm"
            >
              {rarities.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="rounded border-botanical-300"
              />
              <span>Unlocked only</span>
            </label>
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      <motion.div
        layout
        className={`grid gap-4 ${compact ? 'grid-cols-6' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6'}`}
      >
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <AchievementBadge
                achievement={achievement}
                size={compact ? 'sm' : 'md'}
                showProgress={!compact}
                onShare={setShareAchievement}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-muted">
          <span className="text-4xl mb-4 block">🔍</span>
          <p>No achievements match your filters</p>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareAchievement && (
          <ShareAchievementModal
            achievement={shareAchievement}
            onClose={() => setShareAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact achievement showcase for profile
interface AchievementShowcaseProps {
  achievements?: Achievement[];
  maxDisplay?: number;
  className?: string;
}

export function AchievementShowcase({
  achievements = MOCK_ACHIEVEMENTS,
  maxDisplay = 5,
  className = '',
}: AchievementShowcaseProps) {
  const unlockedAchievements = achievements
    .filter(a => a.unlocked)
    .sort((a, b) => {
      // Sort by rarity (legendary first) then by unlock date
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      }
      return new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime();
    })
    .slice(0, maxDisplay);

  if (unlockedAchievements.length === 0) {
    return (
      <div className={`text-sm text-muted ${className}`}>
        No achievements yet
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {unlockedAchievements.map((achievement) => (
        <motion.div
          key={achievement.id}
          whileHover={{ scale: 1.1, y: -2 }}
          className="relative group"
          title={achievement.name}
        >
          <span className="text-2xl cursor-default">{achievement.emoji}</span>
          {/* Mini tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {achievement.name}
          </div>
        </motion.div>
      ))}
      {achievements.filter(a => a.unlocked).length > maxDisplay && (
        <span className="text-sm text-muted self-center">
          +{achievements.filter(a => a.unlocked).length - maxDisplay} more
        </span>
      )}
    </div>
  );
}

export default AchievementDisplay;

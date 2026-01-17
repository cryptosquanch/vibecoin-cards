'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  type CardBack,
  type CardBackType,
  type CollectionSet,
  type CollectionStats,
  type TokenRarity,
  type TokenRarityInfo,
  CARD_BACKS,
  COLLECTION_SETS,
  getTokenRarity,
  calculateSetProgress,
  calculateCollectionStats,
  type SetType,
} from '@/lib/collections';
import type { Token, Holding } from '@/lib/mock-data';

// ============================================
// Card Back Preview
// ============================================

interface CardBackPreviewProps {
  back: CardBackType;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
}

export function CardBackPreview({
  back,
  size = 'md',
  isSelected = false,
  isLocked = false,
  onClick,
}: CardBackPreviewProps) {
  const config = CARD_BACKS[back];
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-24 h-36',
    lg: 'w-32 h-48',
  };

  const patternStyles: Record<string, string> = {
    solid: '',
    gradient: `bg-gradient-to-br from-[${config.preview.primaryColor}] to-[${config.preview.secondaryColor}]`,
    pattern: 'bg-botanical-pattern',
    animated: 'animate-pulse',
  };

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.05 } : undefined}
      whileTap={!isLocked ? { scale: 0.95 } : undefined}
      onClick={!isLocked ? onClick : undefined}
      className={`
        ${sizeClasses[size]}
        rounded-xl relative overflow-hidden
        ${isSelected ? 'ring-4 ring-botanical-500 ring-offset-2' : ''}
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${onClick ? 'hover:shadow-lg transition-shadow' : ''}
      `}
      style={{
        background: config.preview.pattern === 'gradient'
          ? `linear-gradient(135deg, ${config.preview.primaryColor}, ${config.preview.secondaryColor})`
          : config.preview.primaryColor,
      }}
    >
      {/* Pattern overlay */}
      {config.preview.pattern === 'pattern' && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${config.preview.secondaryColor} 1px, transparent 0)`,
            backgroundSize: '10px 10px',
          }}
        />
      )}

      {/* Animated overlay for special backs */}
      {config.preview.pattern === 'animated' && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              `linear-gradient(0deg, ${config.preview.primaryColor}40, ${config.preview.secondaryColor}40)`,
              `linear-gradient(180deg, ${config.preview.primaryColor}40, ${config.preview.secondaryColor}40)`,
              `linear-gradient(360deg, ${config.preview.primaryColor}40, ${config.preview.secondaryColor}40)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white/50 text-2xl">♠</span>
      </div>

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && !isLocked && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-botanical-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      {/* Rarity glow */}
      {config.rarity === 'legendary' && !isLocked && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-yellow-400 animate-pulse" />
      )}
      {config.rarity === 'epic' && !isLocked && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-purple-400" />
      )}
    </motion.div>
  );
}

// ============================================
// Card Back Selector
// ============================================

interface CardBackSelectorProps {
  selected: CardBackType;
  unlocked: CardBackType[];
  onSelect: (back: CardBackType) => void;
}

export function CardBackSelector({ selected, unlocked, onSelect }: CardBackSelectorProps) {
  const allBacks = Object.keys(CARD_BACKS) as CardBackType[];

  return (
    <div className="space-y-4">
      <h3 className="heading-3">Card Backs</h3>
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {allBacks.map((back) => {
          const config = CARD_BACKS[back];
          const isUnlocked = unlocked.includes(back);

          return (
            <div key={back} className="text-center">
              <CardBackPreview
                back={back}
                size="sm"
                isSelected={selected === back}
                isLocked={!isUnlocked}
                onClick={() => isUnlocked && onSelect(back)}
              />
              <p className="text-xs mt-1 text-muted truncate">{config.name}</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {unlocked.length} / {allBacks.length} unlocked
      </p>
    </div>
  );
}

// ============================================
// Card Back Detail
// ============================================

interface CardBackDetailProps {
  back: CardBackType;
  isUnlocked: boolean;
}

export function CardBackDetail({ back, isUnlocked }: CardBackDetailProps) {
  const config = CARD_BACKS[back];

  const rarityColors = {
    common: 'bg-gray-100 text-gray-700',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="surface-panel">
      <div className="flex gap-6">
        <CardBackPreview back={back} size="lg" isLocked={!isUnlocked} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="heading-3">{config.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rarityColors[config.rarity]}`}>
              {config.rarity}
            </span>
          </div>
          <p className="text-muted mb-4">{config.description}</p>
          {!isUnlocked && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">🔒</span>
              <span className="text-muted">{config.unlockRequirement}</span>
            </div>
          )}
          {isUnlocked && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span className="text-xl">✓</span>
              <span>Unlocked!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Collection Set Card
// ============================================

interface CollectionSetCardProps {
  set: CollectionSet;
  compact?: boolean;
}

export function CollectionSetCard({ set, compact = false }: CollectionSetCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div
        className={`surface-card p-3 cursor-pointer hover:bg-muted/10 transition-colors ${
          set.isComplete ? 'ring-2 ring-green-500' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{set.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{set.name}</p>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  set.isComplete ? 'bg-green-500' : 'bg-botanical-500'
                }`}
                style={{ width: `${set.progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted">{set.progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`surface-panel overflow-hidden ${set.isComplete ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-4xl">{set.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold">{set.name}</h4>
            {set.isComplete && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Complete!
              </span>
            )}
          </div>
          <p className="text-sm text-muted">{set.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{set.progress}%</p>
          <p className="text-xs text-muted">{set.requirements.filter(r => r.isMet).length}/{set.requirements.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${set.progress}%` }}
          className={`h-full rounded-full ${
            set.isComplete ? 'bg-green-500' : 'bg-botanical-500'
          }`}
        />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-muted/20">
              {/* Requirements */}
              <div>
                <h5 className="text-sm font-medium text-muted mb-3">Requirements</h5>
                <div className="space-y-2">
                  {set.requirements.map((req, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        req.isMet ? 'text-green-600' : 'text-muted'
                      }`}
                    >
                      <span>{req.isMet ? '✓' : '○'}</span>
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h5 className="text-sm font-medium text-muted mb-3">Rewards</h5>
                <div className="space-y-2">
                  {set.rewards.map((reward, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        set.isComplete ? '' : 'opacity-50'
                      }`}
                    >
                      <span>{reward.icon}</span>
                      <span>{reward.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Collection Sets Grid
// ============================================

interface CollectionSetsGridProps {
  holdings: (Holding & { token: Token })[];
  holdDaysMap?: Record<string, number>;
  compact?: boolean;
}

export function CollectionSetsGrid({ holdings, holdDaysMap = {}, compact = false }: CollectionSetsGridProps) {
  const setIds = Object.keys(COLLECTION_SETS) as SetType[];
  const sets = setIds.map(id => calculateSetProgress(id, holdings, holdDaysMap));
  const completedCount = sets.filter(s => s.isComplete).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="heading-3">Collection Sets</h3>
        <span className="text-sm text-muted">
          {completedCount} / {sets.length} complete
        </span>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-4'}>
        {sets
          .sort((a, b) => b.progress - a.progress)
          .map((set) => (
            <CollectionSetCard key={set.id} set={set} compact={compact} />
          ))}
      </div>
    </div>
  );
}

// ============================================
// Rarity Badge
// ============================================

interface RarityBadgeProps {
  holders: number;
  size?: 'sm' | 'md';
}

export function RarityBadge({ holders, size = 'md' }: RarityBadgeProps) {
  const rarity = getTokenRarity(holders);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-medium`}
      style={{
        backgroundColor: `${rarity.color}20`,
        color: rarity.color,
      }}
    >
      {rarity.label}
    </span>
  );
}

// ============================================
// Collection Stats Display
// ============================================

interface CollectionStatsDisplayProps {
  stats: CollectionStats;
  showDetails?: boolean;
}

export function CollectionStatsDisplay({ stats, showDetails = true }: CollectionStatsDisplayProps) {
  const rankColors: Record<string, string> = {
    Novice: 'text-gray-500',
    Collector: 'text-green-500',
    Enthusiast: 'text-blue-500',
    Connoisseur: 'text-purple-500',
    Master: 'text-yellow-500',
    Grandmaster: 'text-orange-500',
    Legend: 'text-red-500',
  };

  return (
    <div className="surface-panel">
      {/* Score & Rank */}
      <div className="text-center mb-6">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-5xl font-bold mb-1"
        >
          {stats.collectionScore}
        </motion.p>
        <p className="text-sm text-muted mb-2">Collection Score</p>
        <p className={`text-xl font-bold ${rankColors[stats.rank]}`}>
          {stats.rank}
        </p>
      </div>

      {/* Score bar */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(stats.collectionScore / 1000) * 100}%` }}
          className="h-full bg-gradient-to-r from-botanical-500 via-purple-500 to-yellow-500 rounded-full"
        />
      </div>

      {showDetails && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalTokens}</p>
              <p className="text-xs text-muted">Tokens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.uniqueCategories.length}</p>
              <p className="text-xs text-muted">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completedSets.length}</p>
              <p className="text-xs text-muted">Sets Complete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.unlockedBacks.length}</p>
              <p className="text-xs text-muted">Card Backs</p>
            </div>
          </div>

          {/* Bonuses */}
          {(stats.totalFeeDiscount > 0 || stats.airdropBoost > 0) && (
            <div className="border-t border-muted/20 pt-4">
              <h4 className="text-sm font-medium text-muted mb-3">Active Bonuses</h4>
              <div className="flex flex-wrap gap-2">
                {stats.totalFeeDiscount > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    💰 {stats.totalFeeDiscount}% Fee Discount
                  </span>
                )}
                {stats.airdropBoost > 0 && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    🪂 {stats.airdropBoost}% Airdrop Boost
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Titles */}
          {stats.titles.length > 0 && (
            <div className="border-t border-muted/20 pt-4 mt-4">
              <h4 className="text-sm font-medium text-muted mb-3">Earned Titles</h4>
              <div className="flex flex-wrap gap-2">
                {stats.titles.map((title) => (
                  <span
                    key={title}
                    className="px-3 py-1 bg-botanical-100 text-botanical-700 rounded-full text-sm font-medium"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Collection Dashboard (Full View)
// ============================================

interface CollectionDashboardProps {
  holdings: (Holding & { token: Token })[];
  holdDaysMap?: Record<string, number>;
  maxMultiple?: number;
  survivedDumps?: number;
  selectedCardBack: CardBackType;
  onCardBackSelect: (back: CardBackType) => void;
}

export function CollectionDashboard({
  holdings,
  holdDaysMap = {},
  maxMultiple = 1,
  survivedDumps = 0,
  selectedCardBack,
  onCardBackSelect,
}: CollectionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sets' | 'backs'>('overview');

  const stats = calculateCollectionStats(holdings, holdDaysMap, maxMultiple, survivedDumps);

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-muted/20 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'sets', label: 'Sets', icon: '🃏' },
          { id: 'backs', label: 'Card Backs', icon: '🎴' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-botanical-500 text-white'
                : 'hover:bg-muted/10'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <CollectionStatsDisplay stats={stats} />

            {/* Quick view of sets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="heading-3">Collection Progress</h3>
                <button
                  onClick={() => setActiveTab('sets')}
                  className="text-sm text-botanical-500 hover:underline"
                >
                  View All →
                </button>
              </div>
              <CollectionSetsGrid holdings={holdings} holdDaysMap={holdDaysMap} compact />
            </div>
          </motion.div>
        )}

        {activeTab === 'sets' && (
          <motion.div
            key="sets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CollectionSetsGrid holdings={holdings} holdDaysMap={holdDaysMap} />
          </motion.div>
        )}

        {activeTab === 'backs' && (
          <motion.div
            key="backs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <CardBackSelector
              selected={selectedCardBack}
              unlocked={stats.unlockedBacks}
              onSelect={onCardBackSelect}
            />

            {/* Selected card back detail */}
            <CardBackDetail
              back={selectedCardBack}
              isUnlocked={stats.unlockedBacks.includes(selectedCardBack)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Collection Score Badge (Compact)
// ============================================

interface CollectionScoreBadgeProps {
  stats: CollectionStats;
}

export function CollectionScoreBadge({ stats }: CollectionScoreBadgeProps) {
  const rankColors: Record<string, string> = {
    Novice: 'bg-gray-100 text-gray-700',
    Collector: 'bg-green-100 text-green-700',
    Enthusiast: 'bg-blue-100 text-blue-700',
    Connoisseur: 'bg-purple-100 text-purple-700',
    Master: 'bg-yellow-100 text-yellow-700',
    Grandmaster: 'bg-orange-100 text-orange-700',
    Legend: 'bg-red-100 text-red-700',
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-botanical-50 dark:bg-gray-800">
      <span className="text-lg font-bold">{stats.collectionScore}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rankColors[stats.rank]}`}>
        {stats.rank}
      </span>
    </div>
  );
}

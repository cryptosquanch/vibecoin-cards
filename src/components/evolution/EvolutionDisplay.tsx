'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard, getSuitForCategory } from '@/components/design-system';
import {
  type CardEvolutionState,
  type EvolutionBadge,
  type CardEffect,
  getEffectClasses,
  getEvolutionGradient,
  BADGE_CONFIG,
  RANK_ORDER,
} from '@/lib/evolution';
import type { Token } from '@/lib/mock-data';

interface EvolvedCardProps {
  token: Token;
  evolution: Partial<CardEvolutionState>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadges?: boolean;
  flippable?: boolean;
}

/**
 * Playing card with evolution effects applied
 */
export function EvolvedCard({
  token,
  evolution,
  size = 'md',
  showBadges = true,
  flippable = false,
}: EvolvedCardProps) {
  const suit = getSuitForCategory(token.category);
  const baseRank = evolution.evolvedRank || RANK_ORDER[Math.min(token.score / 10, 12) | 0];
  const effect = evolution.effect || 'none';
  const rankChange = evolution.rankChange || 0;
  const badges = evolution.badges || [];

  const effectClasses = getEffectClasses(effect);
  const gradientClasses = getEvolutionGradient(rankChange, effect);

  return (
    <div className="relative">
      {/* Card with effects */}
      <div className={`relative rounded-xl transition-all duration-300 ${effectClasses}`}>
        {/* Gradient overlay for evolved cards */}
        {gradientClasses && (
          <div className={`absolute inset-0 rounded-xl ${gradientClasses} opacity-50 pointer-events-none`} />
        )}

        <PlayingCard
          rank={baseRank as any}
          suit={suit}
          size={size}
          flippable={flippable}
          backVariant="botanical"
        />

        {/* Rank change indicator */}
        {rankChange !== 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
              rankChange > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {rankChange > 0 ? `+${rankChange}` : rankChange}
          </motion.div>
        )}

        {/* Effect indicator for legendary/fire */}
        {(effect === 'legendary' || effect === 'fire') && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`absolute inset-0 ${
              effect === 'legendary'
                ? 'bg-gradient-to-t from-purple-500/20 via-transparent to-yellow-500/20'
                : 'bg-gradient-to-t from-orange-500/30 via-transparent to-transparent'
            } animate-pulse`} />
          </motion.div>
        )}
      </div>

      {/* Badges row */}
      {showBadges && badges.length > 0 && (
        <div className="flex justify-center gap-1 mt-2 flex-wrap">
          {badges.slice(0, 4).map((badge) => (
            <EvolutionBadgeIcon key={badge.type} badge={badge} size="sm" />
          ))}
          {badges.length > 4 && (
            <span className="text-xs text-muted">+{badges.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface EvolutionBadgeIconProps {
  badge: EvolutionBadge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

/**
 * Individual badge icon with tooltip
 */
export function EvolutionBadgeIcon({ badge, size = 'md', showTooltip = true }: EvolutionBadgeIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };

  const rarityColors = {
    common: 'bg-gray-100 ring-gray-300',
    rare: 'bg-blue-100 ring-blue-400',
    epic: 'bg-purple-100 ring-purple-500',
    legendary: 'bg-gradient-to-br from-yellow-100 to-orange-100 ring-yellow-500',
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`${sizeClasses[size]} ${rarityColors[badge.rarity]} rounded-full flex items-center justify-center ring-2 cursor-help relative group`}
      title={`${badge.name}: ${badge.description}`}
    >
      <span>{badge.icon}</span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
            <p className="font-bold">{badge.name}</p>
            <p className="text-gray-300">{badge.description}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface EvolutionStatsProps {
  evolution: Partial<CardEvolutionState>;
  compact?: boolean;
}

/**
 * Evolution statistics display
 */
export function EvolutionStats({ evolution, compact = false }: EvolutionStatsProps) {
  const priceMultiple = evolution.priceMultiple || 1;
  const holdDays = evolution.holdDays || 0;
  const rankChange = evolution.rankChange || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className={`font-bold ${priceMultiple >= 1 ? 'text-green-600' : 'text-red-500'}`}>
          {priceMultiple >= 1 ? '+' : ''}{((priceMultiple - 1) * 100).toFixed(0)}%
        </span>
        <span className="text-muted">{holdDays}d held</span>
        {rankChange !== 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            rankChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)} rank{Math.abs(rankChange) > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className={`text-2xl font-bold ${priceMultiple >= 1 ? 'text-green-600' : 'text-red-500'}`}>
          {priceMultiple.toFixed(2)}x
        </p>
        <p className="text-xs text-muted">Return</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{holdDays}</p>
        <p className="text-xs text-muted">Days Held</p>
      </div>
      <div className="text-center">
        <p className={`text-2xl font-bold ${
          rankChange > 0 ? 'text-green-600' : rankChange < 0 ? 'text-red-500' : ''
        }`}>
          {rankChange > 0 ? '+' : ''}{rankChange}
        </p>
        <p className="text-xs text-muted">Rank Change</p>
      </div>
    </div>
  );
}

interface BadgeCollectionProps {
  badges: EvolutionBadge[];
  showLocked?: boolean;
}

/**
 * Full badge collection display
 */
export function BadgeCollection({ badges, showLocked = true }: BadgeCollectionProps) {
  const allBadgeTypes = Object.keys(BADGE_CONFIG) as Array<keyof typeof BADGE_CONFIG>;
  const unlockedTypes = badges.map(b => b.type);

  return (
    <div className="space-y-4">
      {/* Unlocked badges */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted mb-2">Earned Badges</h4>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <motion.div
                key={badge.type}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-botanical-50 dark:bg-gray-700 rounded-lg"
              >
                <EvolutionBadgeIcon badge={badge} size="md" showTooltip={false} />
                <div>
                  <p className="font-medium text-sm">{badge.name}</p>
                  <p className="text-xs text-muted">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {showLocked && (
        <div>
          <h4 className="text-sm font-medium text-muted mb-2">Available Badges</h4>
          <div className="flex flex-wrap gap-2">
            {allBadgeTypes
              .filter(type => !unlockedTypes.includes(type))
              .map((type) => {
                const config = BADGE_CONFIG[type];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50"
                  >
                    <span className="text-xl grayscale">{config.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{config.name}</p>
                      <p className="text-xs text-muted">{config.description}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

interface EvolutionHistoryProps {
  history: CardEvolutionState['evolutionHistory'];
}

/**
 * Evolution event timeline
 */
export function EvolutionHistory({ history }: EvolutionHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <p>No evolution events yet</p>
        <p className="text-sm">Keep holding to evolve your card!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            event.type === 'rank-up' ? 'bg-green-100 text-green-600' :
            event.type === 'rank-down' ? 'bg-red-100 text-red-600' :
            event.type === 'badge-earned' ? 'bg-purple-100 text-purple-600' :
            'bg-yellow-100 text-yellow-600'
          }`}>
            {event.type === 'rank-up' && '↑'}
            {event.type === 'rank-down' && '↓'}
            {event.type === 'badge-earned' && '🏅'}
            {event.type === 'effect-gained' && '✨'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">{event.description}</p>
            <p className="text-xs text-muted">
              {new Date(event.timestamp).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface EvolutionProgressProps {
  currentMultiple: number;
  nextThreshold: number;
  nextReward: string;
}

/**
 * Progress bar to next evolution milestone
 */
export function EvolutionProgress({ currentMultiple, nextThreshold, nextReward }: EvolutionProgressProps) {
  const progress = Math.min((currentMultiple / nextThreshold) * 100, 100);
  const isComplete = currentMultiple >= nextThreshold;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted">Next Evolution</span>
        <span className={isComplete ? 'text-green-600 font-medium' : ''}>
          {isComplete ? 'Unlocked!' : `${currentMultiple.toFixed(1)}x / ${nextThreshold}x`}
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : 'bg-gradient-to-r from-botanical-500 to-botanical-400'
          }`}
        />
      </div>
      <p className="text-xs text-muted text-center">
        {isComplete ? `🎉 ${nextReward}` : `Reach ${nextThreshold}x for ${nextReward}`}
      </p>
    </div>
  );
}

/**
 * Full evolution card display with all info
 */
interface EvolutionCardFullProps {
  token: Token;
  evolution: Partial<CardEvolutionState>;
}

export function EvolutionCardFull({ token, evolution }: EvolutionCardFullProps) {
  const priceMultiple = evolution.priceMultiple || 1;

  // Determine next milestone
  const milestones = [
    { threshold: 2, reward: '+1 Rank & Glow Effect' },
    { threshold: 5, reward: '+2 Ranks' },
    { threshold: 10, reward: '+3 Ranks & Golden Effect' },
    { threshold: 25, reward: 'Fire Effect' },
    { threshold: 50, reward: '+4 Ranks' },
    { threshold: 100, reward: 'Legendary Effect & Moonshot Badge' },
  ];

  const nextMilestone = milestones.find(m => priceMultiple < m.threshold) || milestones[milestones.length - 1];

  return (
    <div className="surface-panel">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Card Display */}
        <div className="flex justify-center">
          <EvolvedCard
            token={token}
            evolution={evolution}
            size="lg"
            flippable
          />
        </div>

        {/* Stats & Progress */}
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="heading-3 mb-1">{token.name}</h3>
            <p className="text-muted text-sm">{token.symbol}</p>
          </div>

          <EvolutionStats evolution={evolution} />

          <EvolutionProgress
            currentMultiple={priceMultiple}
            nextThreshold={nextMilestone.threshold}
            nextReward={nextMilestone.reward}
          />

          {evolution.badges && evolution.badges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Badges Earned</h4>
              <div className="flex gap-2 flex-wrap">
                {evolution.badges.map(badge => (
                  <EvolutionBadgeIcon key={badge.type} badge={badge} size="md" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

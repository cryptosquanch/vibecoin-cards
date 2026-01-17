'use client';

import { motion } from 'framer-motion';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import {
  evaluateHand,
  getHandColor,
  getHandEmoji,
  HAND_CONFIG,
  type HandResult,
  type TokenCard,
} from '@/lib/hands';
import type { Token } from '@/lib/mock-data';

interface HandDisplayProps {
  tokens: Token[];
  compact?: boolean;
  showAllCards?: boolean;
  className?: string;
}

/**
 * Displays the user's current poker hand from their token holdings
 */
export function HandDisplay({ tokens, compact = false, showAllCards = false, className = '' }: HandDisplayProps) {
  const hand = evaluateHand(tokens);
  const handColor = getHandColor(hand.type);
  const emoji = getHandEmoji(hand.type);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xl">{emoji}</span>
        <div>
          <p className={`font-bold ${handColor}`}>{hand.name}</p>
          <p className="text-xs text-muted">
            {hand.feeDiscount > 0 ? `${hand.feeDiscount}% fee discount` : 'No bonus'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`surface-panel ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h3 className={`heading-3 ${handColor}`}>{hand.name}</h3>
            <p className="text-sm text-muted">{hand.description}</p>
          </div>
        </div>
        {hand.feeDiscount > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">-{hand.feeDiscount}%</p>
            <p className="text-xs text-muted">Fee Discount</p>
          </div>
        )}
      </div>

      {/* Hand Cards */}
      {hand.cards.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted mb-2 uppercase tracking-wide">Your Hand</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {hand.cards.slice(0, 5).map((card, index) => (
              <motion.div
                key={card.token.id}
                initial={{ opacity: 0, y: 20, rotateY: 180 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <PlayingCard
                  rank={card.rank as any}
                  suit={card.suit}
                  size="sm"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Show remaining cards if requested */}
      {showAllCards && tokens.length > 5 && (
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-wide">Other Holdings ({tokens.length - 5})</p>
          <div className="flex gap-2 overflow-x-auto pb-2 opacity-60">
            {tokens.slice(5).map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex-shrink-0"
              >
                <PlayingCard
                  rank={getRankFromScore(token.score) as any}
                  suit={getSuitForCategory(token.category)}
                  size="sm"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hand Strength Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted">Hand Strength</span>
          <span className={handColor}>{hand.strength}/100</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hand.strength}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              hand.strength >= 90 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              hand.strength >= 70 ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
              hand.strength >= 50 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              hand.strength >= 30 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              'bg-botanical-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Mini badge showing current hand
 */
export function HandBadge({ tokens, className = '' }: { tokens: Token[]; className?: string }) {
  const hand = evaluateHand(tokens);
  const handColor = getHandColor(hand.type);
  const emoji = getHandEmoji(hand.type);

  if (hand.type === 'no-hand') return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-botanical-100 dark:bg-gray-700 ${className}`}
    >
      <span>{emoji}</span>
      <span className={`text-xs font-semibold ${handColor}`}>{hand.name}</span>
      {hand.feeDiscount > 0 && (
        <span className="text-xs text-green-600 font-bold">-{hand.feeDiscount}%</span>
      )}
    </motion.div>
  );
}

/**
 * Shows all possible hands and what's needed to achieve them
 */
export function HandGuide({ currentHand }: { currentHand?: HandResult }) {
  const hands = Object.entries(HAND_CONFIG)
    .filter(([type]) => type !== 'no-hand')
    .sort((a, b) => b[1].strength - a[1].strength);

  return (
    <div className="surface-panel">
      <h3 className="heading-3 text-sm mb-4">Hand Rankings</h3>
      <div className="space-y-2">
        {hands.map(([type, config]) => {
          const isCurrentHand = currentHand?.type === type;
          const emoji = getHandEmoji(type as any);

          return (
            <div
              key={type}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isCurrentHand
                  ? 'bg-botanical-100 dark:bg-botanical-900/30 border border-botanical-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <div>
                  <p className={`text-sm font-medium ${isCurrentHand ? 'text-botanical-700 dark:text-botanical-300' : ''}`}>
                    {config.name}
                  </p>
                  <p className="text-xs text-muted">{config.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">-{config.feeDiscount}%</p>
                {isCurrentHand && (
                  <p className="text-xs text-botanical-600">Current</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Animated hand reveal for new achievements
 */
export function HandReveal({ hand, onComplete }: { hand: HandResult; onComplete?: () => void }) {
  const emoji = getHandEmoji(hand.type);
  const handColor = getHandColor(hand.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="text-8xl mb-4"
        >
          {emoji}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl font-bold mb-2 ${handColor}`}
        >
          {hand.name}!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-white mb-4"
        >
          {hand.feeDiscount}% Fee Discount Unlocked
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center gap-2"
        >
          {hand.cards.slice(0, 5).map((card, i) => (
            <motion.div
              key={card.token.id}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <PlayingCard
                rank={card.rank as any}
                suit={card.suit}
                size="md"
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FeeBreakdown as FeeBreakdownType,
  formatFee,
  formatFeePercent,
  FEE_CONFIG,
} from '@/lib/fees';

interface FeeBreakdownProps {
  fees: FeeBreakdownType;
  tradeType: 'buy' | 'sell';
  vibeStaked?: number;
  hasReferrer?: boolean;
  compact?: boolean;
  handName?: string; // Name of the poker hand for display
}

export function FeeBreakdown({
  fees,
  tradeType,
  vibeStaked = 0,
  hasReferrer = false,
  compact = false,
  handName,
}: FeeBreakdownProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDiscount = fees.totalDiscount > 0;

  if (compact) {
    return (
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted">
          Fee ({formatFeePercent(fees.totalFeePercent)})
          {hasDiscount && (
            <span className="ml-1 text-green-600 text-xs">-{fees.totalDiscount}%</span>
          )}
        </span>
        <span className={tradeType === 'buy' ? 'text-red-500' : 'text-red-500'}>
          {tradeType === 'buy' ? '+' : '-'}{formatFee(fees.totalFees)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Total Fee Row - Clickable to expand */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex justify-between items-center text-sm hover:bg-botanical-100 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded transition-colors"
      >
        <span className="text-muted flex items-center gap-2 flex-wrap">
          Platform Fee ({formatFeePercent(fees.totalFeePercent)})
          {fees.handDiscount > 0 && (
            <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 text-xs rounded-full">
              -{fees.handDiscount}% {handName || 'Hand'}
            </span>
          )}
          {fees.vibeDiscount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full">
              -{fees.vibeDiscount}% $VIBE
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        <span>{tradeType === 'buy' ? '+' : '-'}{formatFee(fees.totalFees)}</span>
      </button>

      {/* Expanded Fee Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-botanical-200 dark:border-gray-600 space-y-2 py-2">
              {/* Platform Fee */}
              <div className="flex justify-between text-xs">
                <span className="text-muted flex items-center gap-1">
                  <span className="w-2 h-2 bg-botanical-500 rounded-full" />
                  Treasury ({formatFeePercent(fees.platformFeePercent)})
                </span>
                <span>{formatFee(fees.platformFee)}</span>
              </div>

              {/* Creator Fee */}
              <div className="flex justify-between text-xs">
                <span className="text-muted flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  Creator ({formatFeePercent(fees.creatorFeePercent)})
                </span>
                <span>{formatFee(fees.creatorFee)}</span>
              </div>

              {/* Referrer Fee */}
              {hasReferrer ? (
                <div className="flex justify-between text-xs">
                  <span className="text-muted flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    Referrer ({formatFeePercent(fees.referrerFeePercent)})
                  </span>
                  <span>{formatFee(fees.referrerFee)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-muted flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    Referrer (none)
                  </span>
                  <span className="text-muted">$0.00</span>
                </div>
              )}

              {/* Fee Distribution Visual */}
              <div className="pt-2">
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
                  <div
                    className="bg-botanical-500 h-full"
                    style={{ width: `${(fees.platformFeePercent / fees.totalFeePercent) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500 h-full"
                    style={{ width: `${(fees.creatorFeePercent / fees.totalFeePercent) * 100}%` }}
                  />
                  {hasReferrer && (
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(fees.referrerFeePercent / fees.totalFeePercent) * 100}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Savings & Discount Info */}
              {fees.savingsAmount > 0 && (
                <div className="pt-2 flex justify-between text-xs">
                  <span className="text-green-600 font-medium">You&apos;re saving</span>
                  <span className="text-green-600 font-bold">{formatFee(fees.savingsAmount)}</span>
                </div>
              )}
              {!hasDiscount && (
                <div className="pt-2 text-xs text-muted space-y-1">
                  <p>
                    <span className="text-yellow-600">🃏</span> Build a poker hand to reduce fees up to 50%
                  </p>
                  <p>
                    <span className="text-green-600">💎</span> Stake $VIBE for additional discounts
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Fee Summary Card - For displaying on token pages
 */
interface FeeSummaryProps {
  className?: string;
}

export function FeeSummary({ className = '' }: FeeSummaryProps) {
  return (
    <div className={`surface-panel ${className}`}>
      <h3 className="heading-3 text-sm mb-3">Platform Fees</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Trading Fee</span>
          <span>{FEE_CONFIG.trading.total / 100}%</span>
        </div>
        <div className="pl-4 space-y-1 text-xs text-muted">
          <div className="flex justify-between">
            <span>→ Platform</span>
            <span>{FEE_CONFIG.trading.platform / 100}%</span>
          </div>
          <div className="flex justify-between">
            <span>→ Creator</span>
            <span>{FEE_CONFIG.trading.creator / 100}%</span>
          </div>
          <div className="flex justify-between">
            <span>→ Referrer</span>
            <span>{FEE_CONFIG.trading.referrer / 100}%</span>
          </div>
        </div>
        <hr className="border-botanical-200 dark:border-gray-700" />
        <div className="flex justify-between">
          <span className="text-muted">Graduation Fee</span>
          <span>{FEE_CONFIG.graduation.total / 100}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Launch Fee</span>
          <span>{FEE_CONFIG.launch.standard} ETH</span>
        </div>
      </div>

      {/* $VIBE Discount Tiers */}
      <div className="mt-4 pt-4 border-t border-botanical-200 dark:border-gray-700">
        <p className="text-xs font-medium mb-2">$VIBE Holder Discounts</p>
        <div className="space-y-1">
          {Object.entries(FEE_CONFIG.vibeDiscounts).map(([tier, { minStake, discount }]) => (
            <div key={tier} className="flex justify-between text-xs">
              <span className="text-muted">Stake {minStake}+</span>
              <span className="text-green-600">-{discount}% fees</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Graduation Progress Bar
 */
interface GraduationProgressProps {
  currentMarketCap: number;
  className?: string;
}

export function GraduationProgress({ currentMarketCap, className = '' }: GraduationProgressProps) {
  const threshold = FEE_CONFIG.graduationThreshold;
  const progress = Math.min((currentMarketCap / threshold) * 100, 100);
  const isGraduated = currentMarketCap >= threshold;

  return (
    <div className={`${className}`}>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted">Graduation Progress</span>
        <span className={isGraduated ? 'text-green-600 font-medium' : ''}>
          {isGraduated ? '🎓 Graduated!' : `$${(currentMarketCap / 1000).toFixed(1)}K / $${threshold / 1000}K`}
        </span>
      </div>
      <div className="h-3 bg-botanical-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isGraduated
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : 'bg-gradient-to-r from-botanical-500 to-botanical-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {!isGraduated && (
        <p className="text-xs text-muted mt-1">
          ${((threshold - currentMarketCap) / 1000).toFixed(1)}K to DEX listing
        </p>
      )}
    </div>
  );
}

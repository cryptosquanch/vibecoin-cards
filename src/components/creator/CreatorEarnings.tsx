'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MOCK_CREATOR_EARNINGS, type CreatorEarnings } from '@/lib/fees';
import { MOCK_TOKENS } from '@/lib/mock-data';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface CreatorEarningsCardProps {
  earnings: CreatorEarnings;
  index: number;
}

function CreatorEarningsCard({ earnings, index }: CreatorEarningsCardProps) {
  // Find token details
  const token = MOCK_TOKENS.find(t =>
    t.id === earnings.tokenId ||
    t.id.includes(earnings.tokenId.split('-')[0])
  );

  if (!token) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/marketplace/${token.id}`}>
        <div className="p-4 bg-botanical-50 dark:bg-gray-700 rounded-xl hover:bg-botanical-100 dark:hover:bg-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-botanical-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">{token.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-semibold">{token.name}</p>
                <p className="text-xs text-muted">{token.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">{formatCurrency(earnings.totalEarnings)}</p>
              <p className="text-xs text-muted">Total earned</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="font-semibold">{formatCurrency(earnings.totalVolume)}</p>
              <p className="text-xs text-muted">Volume</p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="font-semibold">{earnings.tradeCount.toLocaleString()}</p>
              <p className="text-xs text-muted">Trades</p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="font-semibold">{formatTimeAgo(earnings.lastEarningAt)}</p>
              <p className="text-xs text-muted">Last earning</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Full creator earnings dashboard
 */
export function CreatorEarningsDashboard() {
  const earningsArray = Object.values(MOCK_CREATOR_EARNINGS);
  const totalEarnings = earningsArray.reduce((sum, e) => sum + e.totalEarnings, 0);
  const totalVolume = earningsArray.reduce((sum, e) => sum + e.totalVolume, 0);
  const totalTrades = earningsArray.reduce((sum, e) => sum + e.tradeCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
          <p className="text-sm text-muted">Total Earnings</p>
        </div>
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
          <p className="text-sm text-muted">Total Volume</p>
        </div>
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold">{totalTrades.toLocaleString()}</p>
          <p className="text-sm text-muted">Total Trades</p>
        </div>
      </div>

      {/* Earnings by Token */}
      <div className="surface-panel">
        <h3 className="heading-3 text-lg mb-4">Earnings by Token</h3>
        <div className="space-y-4">
          {earningsArray.map((earnings, index) => (
            <CreatorEarningsCard key={earnings.tokenId} earnings={earnings} index={index} />
          ))}
        </div>
      </div>

      {/* How Creator Fees Work */}
      <div className="surface-panel">
        <h3 className="heading-3 text-lg mb-4">How Creator Fees Work</h3>
        <div className="space-y-3 text-sm text-muted">
          <p>
            <span className="text-botanical-600 font-semibold">0.3% of all trading volume</span> on your tokens
            is automatically distributed to your wallet.
          </p>
          <p>
            Fees are collected in real-time as trades happen. No action required - earnings are
            automatically credited to your connected wallet.
          </p>
          <div className="p-3 bg-botanical-50 dark:bg-gray-700 rounded-lg">
            <p className="font-medium text-botanical-700 dark:text-botanical-300">Example:</p>
            <p>$10,000 trading volume = $30 creator earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact earnings summary for profile sidebar
 */
export function CreatorEarningsSummary() {
  const earningsArray = Object.values(MOCK_CREATOR_EARNINGS);
  const totalEarnings = earningsArray.reduce((sum, e) => sum + e.totalEarnings, 0);

  if (earningsArray.length === 0) {
    return (
      <div className="surface-panel text-center py-6">
        <p className="text-4xl mb-2">🚀</p>
        <p className="font-semibold mb-1">No tokens launched yet</p>
        <p className="text-sm text-muted mb-4">Launch a token to start earning 0.3% of all trading volume</p>
        <Link href="/launch" className="btn btn-primary text-sm">
          Launch Token
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-3 text-sm">Creator Earnings</h3>
        <Link href="/creator/earnings" className="text-xs text-botanical-600 hover:underline">
          View all →
        </Link>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
        <p className="text-sm text-muted">Lifetime earnings</p>
      </div>

      <div className="space-y-2">
        {earningsArray.slice(0, 3).map((earnings) => {
          const token = MOCK_TOKENS.find(t =>
            t.id === earnings.tokenId ||
            t.id.includes(earnings.tokenId.split('-')[0])
          );
          if (!token) return null;

          return (
            <div key={earnings.tokenId} className="flex items-center justify-between text-sm">
              <span className="text-muted">{token.symbol}</span>
              <span className="font-semibold text-green-600">{formatCurrency(earnings.totalEarnings)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

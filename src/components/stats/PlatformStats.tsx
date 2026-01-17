'use client';

import { motion } from 'framer-motion';
import { MOCK_PLATFORM_STATS, FEE_CONFIG } from '@/lib/fees';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  color: 'green' | 'purple' | 'blue' | 'orange' | 'red';
  delay?: number;
}

function StatCard({ label, value, subValue, icon, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`p-4 rounded-xl border bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {subValue && (
          <span className="text-xs text-muted bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );
}

export function PlatformStats() {
  const stats = MOCK_PLATFORM_STATS;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          label="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          color="green"
          delay={0}
        />
        <StatCard
          icon="🏦"
          label="Treasury Balance"
          value={formatCurrency(stats.totalFeesCollected)}
          subValue={`${FEE_CONFIG.trading.platform / 100}% of volume`}
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon="👨‍🎨"
          label="Creator Earnings"
          value={formatCurrency(stats.totalCreatorEarnings)}
          subValue={`${FEE_CONFIG.trading.creator / 100}% of volume`}
          color="purple"
          delay={0.2}
        />
        <StatCard
          icon="🔥"
          label="$VIBE Burned"
          value={formatCurrency(stats.totalBurned)}
          subValue="Deflationary"
          color="red"
          delay={0.3}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="📈"
          label="Total Trades"
          value={formatNumber(stats.totalTrades)}
          color="green"
          delay={0.4}
        />
        <StatCard
          icon="🎓"
          label="Graduations"
          value={stats.totalGraduations.toString()}
          subValue={`${FEE_CONFIG.graduation.total / 100}% fee each`}
          color="orange"
          delay={0.5}
        />
        <StatCard
          icon="🚀"
          label="Tokens Launched"
          value={stats.totalLaunches.toString()}
          subValue={`${FEE_CONFIG.launch.standard} ETH each`}
          color="blue"
          delay={0.6}
        />
        <StatCard
          icon="🤝"
          label="Referrer Earnings"
          value={formatCurrency(stats.totalReferrerEarnings)}
          subValue={`${FEE_CONFIG.trading.referrer / 100}% of volume`}
          color="purple"
          delay={0.7}
        />
      </div>
    </div>
  );
}

/**
 * Compact stats bar for header or sidebar
 */
export function PlatformStatsBar() {
  const stats = MOCK_PLATFORM_STATS;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted">Volume:</span>
        <span className="font-semibold text-green-600">{formatCurrency(stats.totalVolume)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted">Trades:</span>
        <span className="font-semibold">{formatNumber(stats.totalTrades)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted">Graduated:</span>
        <span className="font-semibold text-orange-600">{stats.totalGraduations}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted">Burned:</span>
        <span className="font-semibold text-red-600">{formatCurrency(stats.totalBurned)}</span>
      </div>
    </div>
  );
}

/**
 * Fee distribution visualization
 */
export function FeeDistributionChart() {
  const { trading, graduation } = FEE_CONFIG;

  const tradingFees = [
    { label: 'Treasury', percent: trading.platform / 100, color: 'bg-botanical-500' },
    { label: 'Creator', percent: trading.creator / 100, color: 'bg-purple-500' },
    { label: 'Referrer', percent: trading.referrer / 100, color: 'bg-blue-500' },
  ];

  return (
    <div className="surface-panel">
      <h3 className="heading-3 text-sm mb-4">Fee Distribution</h3>

      {/* Trading Fees */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Trading Fee</span>
          <span className="font-semibold">{trading.total / 100}%</span>
        </div>
        <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
          {tradingFees.map((fee, i) => (
            <motion.div
              key={fee.label}
              initial={{ width: 0 }}
              animate={{ width: `${(fee.percent / (trading.total / 100)) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${fee.color} h-full`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs">
          {tradingFees.map((fee) => (
            <div key={fee.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${fee.color}`} />
              <span className="text-muted">{fee.label}: {fee.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graduation Fees */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Graduation Fee</span>
          <span className="font-semibold">{graduation.total / 100}%</span>
        </div>
        <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-botanical-500 h-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-red-500 h-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-botanical-500" />
            <span className="text-muted">Treasury: {graduation.platform / 100}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted">Burn: {graduation.burn / 100}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Revenue breakdown for a time period
 */
interface RevenueBreakdownProps {
  period?: '24h' | '7d' | '30d' | 'all';
}

export function RevenueBreakdown({ period = 'all' }: RevenueBreakdownProps) {
  const stats = MOCK_PLATFORM_STATS;

  // In production, filter by period
  const revenue = {
    trading: stats.totalFeesCollected * 0.7, // ~70% from trading
    graduations: stats.totalFeesCollected * 0.25, // ~25% from graduations
    launches: stats.totalFeesCollected * 0.05, // ~5% from launches
  };

  const total = revenue.trading + revenue.graduations + revenue.launches;

  return (
    <div className="surface-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-3 text-sm">Revenue Breakdown</h3>
        <span className="text-xs text-muted uppercase">{period}</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Trading Fees</span>
            <span className="font-semibold">{formatCurrency(revenue.trading)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(revenue.trading / total) * 100}%` }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Graduation Fees</span>
            <span className="font-semibold">{formatCurrency(revenue.graduations)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(revenue.graduations / total) * 100}%` }}
              transition={{ delay: 0.1 }}
              className="h-full bg-orange-500 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Launch Fees</span>
            <span className="font-semibold">{formatCurrency(revenue.launches)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(revenue.launches / total) * 100}%` }}
              transition={{ delay: 0.2 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>

        <hr className="border-botanical-200 dark:border-gray-700" />

        <div className="flex justify-between font-semibold">
          <span>Total Revenue</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

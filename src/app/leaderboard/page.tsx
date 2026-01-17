'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import { MOCK_TOKENS, MOCK_TOP_TRADERS, type Token, type Trader } from '@/lib/mock-data';

type Tab = 'apps' | 'trending' | 'investors';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankBadge(rank: number): { bg: string; text: string; label: string } {
  switch (rank) {
    case 1:
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '1st' };
    case 2:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: '2nd' };
    case 3:
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: '3rd' };
    default:
      return { bg: 'bg-botanical-100', text: 'text-botanical-700', label: `#${rank}` };
  }
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('apps');

  // Sort tokens by score for top ranked
  const topRankedTokens = useMemo(() => {
    return [...MOCK_TOKENS].sort((a, b) => b.score - a.score);
  }, []);

  // Sort tokens by 24h price change for trending
  const trendingTokens = useMemo(() => {
    return [...MOCK_TOKENS].sort((a, b) => b.priceChange24h - a.priceChange24h);
  }, []);

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="heading-1 mb-2">Leaderboard</h1>
          <p className="text-muted">
            Top performing apps and investors on the 0G ecosystem
          </p>
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-6 px-6">
          {([
            { id: 'apps' as Tab, label: 'Top Performing', icon: '👑' },
            { id: 'trending' as Tab, label: 'Trending', icon: '🔥' },
            { id: 'investors' as Tab, label: 'Top Investors', icon: '🏆' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap flex-shrink-0`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Performing Apps */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            {/* Top 3 Featured */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topRankedTokens.slice(0, 3).map((token, index) => (
                <TokenPodium key={token.id} token={token} rank={index + 1} />
              ))}
            </div>

            {/* Rest of Rankings */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Full Rankings</h3>
              <div className="divide-y divide-botanical-200">
                {topRankedTokens.map((token, index) => (
                  <TokenRow key={token.id} token={token} rank={index + 1} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trending Tokens */}
        {activeTab === 'trending' && (
          <div className="space-y-6">
            {/* Biggest Gainers */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">
                <span className="text-green-500 mr-2">📈</span>
                Biggest Gainers (24h)
              </h3>
              <div className="divide-y divide-botanical-200">
                {trendingTokens
                  .filter(t => t.priceChange24h > 0)
                  .map((token, index) => (
                    <TokenRow key={token.id} token={token} rank={index + 1} showChange />
                  ))}
              </div>
            </div>

            {/* Biggest Losers */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">
                <span className="text-red-500 mr-2">📉</span>
                Biggest Losers (24h)
              </h3>
              <div className="divide-y divide-botanical-200">
                {[...trendingTokens]
                  .reverse()
                  .filter(t => t.priceChange24h < 0)
                  .map((token, index) => (
                    <TokenRow key={token.id} token={token} rank={index + 1} showChange />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Investors */}
        {activeTab === 'investors' && (
          <div className="space-y-6">
            {/* Top 3 Featured */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {MOCK_TOP_TRADERS.slice(0, 3).map((trader) => (
                <TraderPodium key={trader.address} trader={trader} />
              ))}
            </div>

            {/* Full Rankings - Table on desktop, Cards on mobile */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">All Investors</h3>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted border-b border-botanical-200">
                      <th className="pb-3 pr-4">Rank</th>
                      <th className="pb-3 pr-4">Investor</th>
                      <th className="pb-3 pr-4 text-right">Returns</th>
                      <th className="pb-3 pr-4 text-right">ROI</th>
                      <th className="pb-3 pr-4 text-right">Investments</th>
                      <th className="pb-3 pr-4 text-right">Win Rate</th>
                      <th className="pb-3 text-right">Top App</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-botanical-200">
                    {MOCK_TOP_TRADERS.map((trader) => {
                      const badge = getRankBadge(trader.rank);
                      return (
                        <tr key={trader.address} className="hover:bg-botanical-50">
                          <td className="py-4 pr-4">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="font-mono text-sm">
                              {shortenAddress(trader.address)}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <span className="font-semibold text-green-600">
                              +${trader.pnl.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <span className="text-green-600">
                              +{trader.pnlPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-right">
                            {trader.tradesCount}
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <span className={trader.winRate >= 60 ? 'text-green-600' : ''}>
                              {trader.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="px-2 py-1 bg-botanical-100 rounded text-sm">
                              {trader.topHolding}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {MOCK_TOP_TRADERS.map((trader) => {
                  const badge = getRankBadge(trader.rank);
                  return (
                    <div key={trader.address} className="p-4 bg-botanical-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-sm">
                            {shortenAddress(trader.address)}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-botanical-100 rounded text-xs">
                          {trader.topHolding}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="font-semibold text-green-600 text-sm">+${(trader.pnl / 1000).toFixed(1)}K</p>
                          <p className="text-xs text-muted">Returns</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-600 text-sm">+{trader.pnlPercent.toFixed(0)}%</p>
                          <p className="text-xs text-muted">ROI</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{trader.tradesCount}</p>
                          <p className="text-xs text-muted">Apps</p>
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${trader.winRate >= 60 ? 'text-green-600' : ''}`}>{trader.winRate.toFixed(0)}%</p>
                          <p className="text-xs text-muted">Win</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Token Podium Card Component
function TokenPodium({ token, rank }: { token: Token; rank: number }) {
  const badge = getRankBadge(rank);
  const podiumHeight = rank === 1 ? 'pt-0' : rank === 2 ? 'pt-8' : 'pt-12';

  return (
    <Link href={`/marketplace/${token.id}`}>
      <div className={`surface-panel text-center ${podiumHeight} hover:shadow-lg transition-shadow`}>
        {/* Rank Badge */}
        <div className={`inline-block px-4 py-1.5 rounded-full text-lg font-bold mb-4 ${badge.bg} ${badge.text}`}>
          {rank === 1 ? '👑 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
        </div>

        {/* Card */}
        <div className="flex justify-center mb-4">
          <PlayingCard
            rank={getRankFromScore(token.score) as any}
            suit={getSuitForCategory(token.category)}
            size="md"
            flippable={false}
          />
        </div>

        {/* Token Info */}
        <h3 className="font-semibold text-lg">{token.name}</h3>
        <p className="text-muted text-sm mb-2">{token.symbol}</p>

        {/* Performance */}
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-2xl font-bold">{token.score}</p>
            <p className="text-xs text-muted">Performance</p>
          </div>
          <div className="h-8 w-px bg-botanical-200" />
          <div>
            <p className={`text-lg font-semibold ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">24h</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Token Row Component
function TokenRow({ token, rank, showChange = false }: { token: Token; rank: number; showChange?: boolean }) {
  const badge = getRankBadge(rank);

  return (
    <Link href={`/marketplace/${token.id}`}>
      <div className="py-4 flex items-center gap-2 sm:gap-4 hover:bg-botanical-50 transition-colors -mx-6 px-6">
        {/* Rank */}
        <div className={`w-10 sm:w-12 text-center px-1.5 sm:px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${badge.bg} ${badge.text}`}>
          {badge.label}
        </div>

        {/* Mini Card - Hidden on very small screens */}
        <div className="flex-shrink-0 hidden xs:block">
          <PlayingCard
            rank={getRankFromScore(token.score) as any}
            suit={getSuitForCategory(token.category)}
            size="sm"
            flippable={false}
          />
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base truncate">{token.name}</p>
          <p className="text-muted text-xs sm:text-sm">{token.symbol}</p>
        </div>

        {/* Category - Hidden on mobile */}
        <div className="hidden sm:block">
          <span className="px-2 py-1 bg-botanical-100 rounded text-sm">
            {token.category}
          </span>
        </div>

        {/* Score or Change */}
        {showChange ? (
          <div className="text-right min-w-[60px] sm:min-w-[80px]">
            <p className={`text-sm sm:text-lg font-bold ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
            </p>
            <p className="text-xs text-muted hidden sm:block">24h change</p>
          </div>
        ) : (
          <div className="text-right min-w-[50px] sm:min-w-[80px]">
            <p className="text-sm sm:text-lg font-bold">{token.score}</p>
            <p className="text-xs text-muted hidden sm:block">Performance</p>
          </div>
        )}

        {/* Price - Condensed on mobile */}
        <div className="text-right min-w-[60px] sm:min-w-[80px]">
          <p className="font-semibold text-sm sm:text-base">${token.price.toFixed(2)}</p>
          <p className={`text-xs ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
          </p>
        </div>
      </div>
    </Link>
  );
}

// Trader Podium Card Component
function TraderPodium({ trader }: { trader: Trader }) {
  const badge = getRankBadge(trader.rank);
  const podiumHeight = trader.rank === 1 ? 'pt-0' : trader.rank === 2 ? 'pt-6' : 'pt-10';

  return (
    <div className={`surface-panel text-center ${podiumHeight}`}>
      {/* Rank Badge */}
      <div className={`inline-block px-4 py-1.5 rounded-full text-lg font-bold mb-4 ${badge.bg} ${badge.text}`}>
        {trader.rank === 1 ? '👑 1st' : trader.rank === 2 ? '🥈 2nd' : '🥉 3rd'}
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 bg-gradient-to-br from-botanical-400 to-botanical-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-xl text-white font-bold">
          {trader.address.slice(2, 4).toUpperCase()}
        </span>
      </div>

      {/* Address */}
      <p className="font-mono text-sm text-muted mb-2">
        {shortenAddress(trader.address)}
      </p>

      {/* Stats */}
      <div className="space-y-2">
        <div>
          <p className="text-2xl font-bold text-green-600">+${trader.pnl.toLocaleString()}</p>
          <p className="text-xs text-muted">Total Returns</p>
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <div>
            <p className="font-semibold">{trader.tradesCount}</p>
            <p className="text-xs text-muted">Apps</p>
          </div>
          <div>
            <p className="font-semibold text-green-600">{trader.winRate.toFixed(0)}%</p>
            <p className="text-xs text-muted">Win Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

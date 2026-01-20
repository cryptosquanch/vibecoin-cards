'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import { LeaderboardDisplay, LeaderboardTabs } from '@/components/social';
import type { Rank, Suit } from '@/components/design-system';
import type { LeaderboardType } from '@/lib/leaderboards';

type Tab = 'apps' | 'trending' | 'investors' | 'gamification';

interface Token {
  id: string;
  name: string;
  symbol: string;
  category: string;
  price: number;
  priceChange24h: number;
  score: number;
  logo: string;
  marketCap: number;
  volume24h: number;
  holders: number;
}

interface Trader {
  rank: number;
  address: string;
  username: string | null;
  totalProfitLoss: number;
  totalTrades: number;
  battleWins: number;
  holdingsCount: number;
  portfolioValue: number;
}

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
  const [tokens, setTokens] = useState<Token[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch tokens sorted by the appropriate metric
        const sortBy = activeTab === 'trending' ? 'priceChange' : 'score';
        const tokensRes = await fetch(`/api/tokens?sortBy=${sortBy}&order=desc&limit=20`);
        const tokensData = await tokensRes.json();
        setTokens(tokensData.tokens || []);

        // Fetch top traders
        if (activeTab === 'investors') {
          const tradersRes = await fetch('/api/leaderboard?type=traders&limit=20');
          const tradersData = await tradersRes.json();
          setTraders(tradersData.traders || []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeTab]);

  // Sort tokens
  const topRankedTokens = [...tokens].sort((a, b) => b.score - a.score);
  const trendingTokens = [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h);

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

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-6 px-6">
          {([
            { id: 'apps' as Tab, label: 'Top Performing', icon: '👑' },
            { id: 'trending' as Tab, label: 'Trending', icon: '🔥' },
            { id: 'investors' as Tab, label: 'Top Investors', icon: '🏆' },
            { id: 'gamification' as Tab, label: 'Gamification', icon: '🎮' },
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

        {loading ? (
          <div className="surface-panel text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-botanical-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* Top Performing Apps */}
            {activeTab === 'apps' && (
              <div className="space-y-6">
                {/* Top 3 Featured */}
                {topRankedTokens.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {topRankedTokens.slice(0, 3).map((token, index) => (
                      <TokenPodium key={token.id} token={token} rank={index + 1} />
                    ))}
                  </div>
                )}

                {/* Full Rankings */}
                <div className="surface-panel">
                  <h3 className="heading-3 mb-4">Full Rankings</h3>
                  {topRankedTokens.length === 0 ? (
                    <p className="text-muted text-center py-8">No apps yet</p>
                  ) : (
                    <div className="divide-y divide-botanical-200">
                      {topRankedTokens.map((token, index) => (
                        <TokenRow key={token.id} token={token} rank={index + 1} />
                      ))}
                    </div>
                  )}
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
                  {trendingTokens.filter(t => t.priceChange24h > 0).length === 0 ? (
                    <p className="text-muted text-center py-8">No gainers today</p>
                  ) : (
                    <div className="divide-y divide-botanical-200">
                      {trendingTokens
                        .filter(t => t.priceChange24h > 0)
                        .map((token, index) => (
                          <TokenRow key={token.id} token={token} rank={index + 1} showChange />
                        ))}
                    </div>
                  )}
                </div>

                {/* Biggest Losers */}
                <div className="surface-panel">
                  <h3 className="heading-3 mb-4">
                    <span className="text-red-500 mr-2">📉</span>
                    Biggest Losers (24h)
                  </h3>
                  {trendingTokens.filter(t => t.priceChange24h < 0).length === 0 ? (
                    <p className="text-muted text-center py-8">No losers today</p>
                  ) : (
                    <div className="divide-y divide-botanical-200">
                      {[...trendingTokens]
                        .reverse()
                        .filter(t => t.priceChange24h < 0)
                        .map((token, index) => (
                          <TokenRow key={token.id} token={token} rank={index + 1} showChange />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Investors */}
            {activeTab === 'investors' && (
              <div className="space-y-6">
                {/* Top 3 Featured */}
                {traders.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {traders.slice(0, 3).map((trader, index) => (
                      <TraderPodium key={trader.address} trader={{ ...trader, rank: index + 1 }} />
                    ))}
                  </div>
                )}

                {/* Full Rankings */}
                <div className="surface-panel">
                  <h3 className="heading-3 mb-4">All Investors</h3>
                  {traders.length === 0 ? (
                    <p className="text-muted text-center py-8">No traders yet</p>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-muted border-b border-botanical-200">
                              <th className="pb-3 pr-4">Rank</th>
                              <th className="pb-3 pr-4">Investor</th>
                              <th className="pb-3 pr-4 text-right">P&L</th>
                              <th className="pb-3 pr-4 text-right">Portfolio</th>
                              <th className="pb-3 pr-4 text-right">Trades</th>
                              <th className="pb-3 text-right">Battle Wins</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-botanical-200">
                            {traders.map((trader, index) => {
                              const badge = getRankBadge(index + 1);
                              return (
                                <tr key={trader.address} className="hover:bg-botanical-50">
                                  <td className="py-4 pr-4">
                                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="py-4 pr-4">
                                    <div>
                                      <span className="font-mono text-sm">
                                        {trader.username || shortenAddress(trader.address)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 pr-4 text-right">
                                    <span className={`font-semibold ${trader.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      {trader.totalProfitLoss >= 0 ? '+' : ''}${trader.totalProfitLoss.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="py-4 pr-4 text-right">
                                    ${trader.portfolioValue.toLocaleString()}
                                  </td>
                                  <td className="py-4 pr-4 text-right">
                                    {trader.totalTrades}
                                  </td>
                                  <td className="py-4 text-right">
                                    <span className="text-green-600 font-medium">{trader.battleWins}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {traders.map((trader, index) => {
                          const badge = getRankBadge(index + 1);
                          return (
                            <div key={trader.address} className="p-4 bg-botanical-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                                    {badge.label}
                                  </span>
                                  <span className="font-mono text-sm">
                                    {trader.username || shortenAddress(trader.address)}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                  <p className={`font-semibold text-sm ${trader.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {trader.totalProfitLoss >= 0 ? '+' : ''}${(trader.totalProfitLoss / 1000).toFixed(1)}K
                                  </p>
                                  <p className="text-xs text-muted">P&L</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">${(trader.portfolioValue / 1000).toFixed(1)}K</p>
                                  <p className="text-xs text-muted">Value</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{trader.totalTrades}</p>
                                  <p className="text-xs text-muted">Trades</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-green-600">{trader.battleWins}</p>
                                  <p className="text-xs text-muted">Wins</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Gamification Leaderboards */}
            {activeTab === 'gamification' && (
              <div className="space-y-8">
                {/* Quick Overview - Top 3 from each category */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="surface-panel p-4 text-center">
                    <span className="text-3xl mb-2 block">🃏</span>
                    <h4 className="font-bold">Best Hands</h4>
                    <p className="text-sm text-muted">Poker rankings</p>
                  </div>
                  <div className="surface-panel p-4 text-center">
                    <span className="text-3xl mb-2 block">⭐</span>
                    <h4 className="font-bold">XP Leaders</h4>
                    <p className="text-sm text-muted">Experience points</p>
                  </div>
                  <div className="surface-panel p-4 text-center">
                    <span className="text-3xl mb-2 block">💎</span>
                    <h4 className="font-bold">Diamond Hands</h4>
                    <p className="text-sm text-muted">Longest holders</p>
                  </div>
                  <div className="surface-panel p-4 text-center">
                    <span className="text-3xl mb-2 block">📊</span>
                    <h4 className="font-bold">Volume Kings</h4>
                    <p className="text-sm text-muted">Trading volume</p>
                  </div>
                </div>

                {/* Full Leaderboard Tabs */}
                <LeaderboardTabs />

                {/* Category Grids */}
                <div className="grid md:grid-cols-2 gap-6">
                  <LeaderboardDisplay type="hands" limit={5} />
                  <LeaderboardDisplay type="xp" limit={5} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <LeaderboardDisplay type="diamond-hands" limit={5} />
                  <LeaderboardDisplay type="volume" limit={5} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <LeaderboardDisplay type="portfolio" limit={5} />
                  <LeaderboardDisplay type="collection" limit={5} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <LeaderboardDisplay type="battle" limit={5} />
                  <LeaderboardDisplay type="performance" limit={5} />
                </div>
              </div>
            )}
          </>
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
        <div className={`inline-block px-4 py-1.5 rounded-full text-lg font-bold mb-4 ${badge.bg} ${badge.text}`}>
          {rank === 1 ? '👑 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
        </div>

        <div className="flex justify-center mb-4">
          <PlayingCard
            rank={getRankFromScore(token.score) as Rank}
            suit={getSuitForCategory(token.category) as Suit}
            size="md"
            flippable={false}
          />
        </div>

        <h3 className="font-semibold text-lg">{token.name}</h3>
        <p className="text-muted text-sm mb-2">{token.symbol}</p>

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
        <div className={`w-10 sm:w-12 text-center px-1.5 sm:px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${badge.bg} ${badge.text}`}>
          {badge.label}
        </div>

        <div className="flex-shrink-0 hidden xs:block">
          <PlayingCard
            rank={getRankFromScore(token.score) as Rank}
            suit={getSuitForCategory(token.category) as Suit}
            size="sm"
            flippable={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base truncate">{token.name}</p>
          <p className="text-muted text-xs sm:text-sm">{token.symbol}</p>
        </div>

        <div className="hidden sm:block">
          <span className="px-2 py-1 bg-botanical-100 rounded text-sm">
            {token.category}
          </span>
        </div>

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
      <div className={`inline-block px-4 py-1.5 rounded-full text-lg font-bold mb-4 ${badge.bg} ${badge.text}`}>
        {trader.rank === 1 ? '👑 1st' : trader.rank === 2 ? '🥈 2nd' : '🥉 3rd'}
      </div>

      <div className="w-16 h-16 bg-gradient-to-br from-botanical-400 to-botanical-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-xl text-white font-bold">
          {trader.address.slice(2, 4).toUpperCase()}
        </span>
      </div>

      <p className="font-mono text-sm text-muted mb-2">
        {trader.username || shortenAddress(trader.address)}
      </p>

      <div className="space-y-2">
        <div>
          <p className={`text-2xl font-bold ${trader.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trader.totalProfitLoss >= 0 ? '+' : ''}${trader.totalProfitLoss.toLocaleString()}
          </p>
          <p className="text-xs text-muted">Total P&L</p>
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <div>
            <p className="font-semibold">{trader.totalTrades}</p>
            <p className="text-xs text-muted">Trades</p>
          </div>
          <div>
            <p className="font-semibold text-green-600">{trader.battleWins}</p>
            <p className="text-xs text-muted">Wins</p>
          </div>
        </div>
      </div>
    </div>
  );
}

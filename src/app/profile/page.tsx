'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Header } from '@/components/layout';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import { TradeModal } from '@/components/trading';
import { WatchlistButton } from '@/components/watchlist';
import { HandDisplay, HandGuide } from '@/components/hands';
import { EvolvedCard, EvolutionStats, EvolutionBadgeIcon } from '@/components/evolution';
import { CollectionDashboard, CollectionScoreBadge } from '@/components/collections';
import { QuickBattleWidget, BattleStatsCard, LeaderboardDisplay } from '@/components/social';
import { useWatchlistStore } from '@/store';
import { MOCK_EVOLUTION_DATA, type CardEvolutionState } from '@/lib/evolution';
import { MOCK_BATTLE_STATS, getBattleRank } from '@/lib/battles';
import {
  MOCK_COLLECTION_DATA,
  calculateCollectionStats,
  type CardBackType,
} from '@/lib/collections';
import {
  MOCK_HOLDINGS,
  MOCK_TRANSACTIONS,
  MOCK_USER_ACHIEVEMENTS,
  MOCK_TOKENS,
  type Token,
  type Holding,
  type Transaction,
  type UserAchievement,
} from '@/lib/mock-data';

type Tab = 'holdings' | 'collection' | 'social' | 'watchlist' | 'history' | 'achievements';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

export default function ProfilePage() {
  const { authenticated, user, login } = usePrivy();
  const [activeTab, setActiveTab] = useState<Tab>('holdings');
  const [holdings, setHoldings] = useState<(Holding & { token: Token })[]>([]);
  const [transactions, setTransactions] = useState<(Transaction & { token: Token })[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedCardBack, setSelectedCardBack] = useState<CardBackType>(
    MOCK_COLLECTION_DATA.selectedCardBack
  );
  const { watchlist } = useWatchlistStore();

  // Get watched tokens
  const watchedTokens = useMemo(() => {
    return MOCK_TOKENS.filter(token => watchlist.includes(token.id));
  }, [watchlist]);

  useEffect(() => {
    // Merge holdings with token data
    const holdingsWithTokens = MOCK_HOLDINGS.map(holding => {
      const token = MOCK_TOKENS.find(t => t.id === holding.tokenId)!;
      return { ...holding, token };
    });
    setHoldings(holdingsWithTokens);

    // Merge transactions with token data
    const transactionsWithTokens = MOCK_TRANSACTIONS.map(tx => {
      const token = MOCK_TOKENS.find(t => t.id === tx.tokenId)!;
      return { ...tx, token };
    });
    setTransactions(transactionsWithTokens);

    // Set achievements
    setAchievements(MOCK_USER_ACHIEVEMENTS);
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  // Get user's tokens for hand calculation
  const userTokens = useMemo(() => holdings.map(h => h.token), [holdings]);

  // Calculate collection stats
  const collectionStats = useMemo(() => {
    return calculateCollectionStats(
      holdings,
      MOCK_COLLECTION_DATA.holdDaysMap,
      MOCK_COLLECTION_DATA.maxMultiple,
      MOCK_COLLECTION_DATA.survivedDumps
    );
  }, [holdings]);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  const openTradeModal = (token: Token, type: 'buy' | 'sell') => {
    setSelectedToken(token);
    setTradeType(type);
  };

  if (!authenticated) {
    return (
      <div className="botanical-bg min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="surface-panel text-center py-16">
            <div className="w-24 h-24 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🃏</span>
            </div>
            <h1 className="heading-2 mb-4">Connect Your Wallet</h1>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Connect your wallet to view your app investments, track your earnings, and unlock achievements.
            </p>
            <button onClick={login} className="btn btn-primary">
              Connect Wallet
            </button>
          </div>
        </main>
      </div>
    );
  }

  const walletAddress = user?.wallet?.address || '0x0000...0000';

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="surface-panel mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar + User Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-botanical-400 to-botanical-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl md:text-3xl text-white font-bold">
                  {walletAddress.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold">My Portfolio</h1>
                <p className="text-muted font-mono text-sm">
                  {shortenAddress(walletAddress)}
                </p>
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div className="text-center">
                <p className="text-muted text-xs md:text-sm">Total Value</p>
                <p className="text-lg md:text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted text-xs md:text-sm">Total Returns</p>
                <p className={`text-lg md:text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
                </p>
                <p className={`text-xs ${totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}%)
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted text-xs md:text-sm">Achievements</p>
                <p className="text-lg md:text-2xl font-bold">
                  {unlockedAchievements.length}/{achievements.length}
                </p>
              </div>
            </div>
          </div>

          {/* Collection Score Badge */}
          {holdings.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-muted/20 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-muted text-sm">Collection Rank:</span>
                <CollectionScoreBadge stats={collectionStats} />
              </div>
              <button
                onClick={() => setActiveTab('collection')}
                className="text-sm text-botanical-500 hover:underline"
              >
                View Collection →
              </button>
            </div>
          )}
        </div>

        {/* Poker Hand Display */}
        {userTokens.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <HandDisplay tokens={userTokens} showAllCards />
            </div>
            <div>
              <HandGuide />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-6 px-6">
          {([
            { id: 'holdings' as Tab, label: 'My Apps' },
            { id: 'collection' as Tab, label: '🃏 Collection' },
            { id: 'social' as Tab, label: '⚔️ Social' },
            { id: 'watchlist' as Tab, label: `Watchlist (${watchedTokens.length})` },
            { id: 'history' as Tab, label: 'History' },
            { id: 'achievements' as Tab, label: 'Achievements' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn whitespace-nowrap ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <div className="space-y-4">
            {holdings.length === 0 ? (
              <div className="surface-panel text-center py-12">
                <p className="text-muted mb-4">You don&apos;t own any apps yet</p>
                <Link href="/marketplace" className="btn btn-primary">
                  Browse Apps
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {holdings.map((holding) => {
                  // Get evolution data for this holding
                  const evolution = MOCK_EVOLUTION_DATA[holding.tokenId] || {};

                  return (
                  <div key={holding.tokenId} className="surface-panel">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Top row: Card + Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Evolved Card */}
                        <div className="flex-shrink-0">
                          <EvolvedCard
                            token={holding.token}
                            evolution={evolution}
                            size="sm"
                            showBadges={false}
                          />
                        </div>

                        {/* Token Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/marketplace/${holding.tokenId}`}
                              className="font-semibold hover:text-botanical-600 transition-colors"
                            >
                              {holding.token.name}
                            </Link>
                            {/* Evolution badges */}
                            {evolution.badges && evolution.badges.length > 0 && (
                              <div className="flex gap-1">
                                {evolution.badges.slice(0, 3).map(badge => (
                                  <EvolutionBadgeIcon key={badge.type} badge={badge} size="sm" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-muted text-sm">{holding.token.symbol}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm">
                              {holding.amount.toLocaleString()} shares
                            </p>
                            {evolution.rankChange !== undefined && evolution.rankChange !== 0 && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                evolution.rankChange > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {evolution.rankChange > 0 ? '↑' : '↓'}{Math.abs(evolution.rankChange)} rank
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mobile: Value & P&L */}
                        <div className="sm:hidden text-right">
                          <p className="font-semibold">${holding.currentValue.toLocaleString()}</p>
                          <p className={`text-sm ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Desktop: Price columns */}
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-muted text-sm">Avg Buy</p>
                          <p className="font-medium">${holding.avgBuyPrice.toFixed(4)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-muted text-sm">Current</p>
                          <p className="font-medium">${holding.token.price.toFixed(4)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-muted text-sm">Value</p>
                          <p className="font-semibold">${holding.currentValue.toLocaleString()}</p>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="text-muted text-sm">P&L</p>
                          <p className={`font-semibold ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(2)}
                            <span className="text-xs ml-1">
                              ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                          onClick={() => openTradeModal(holding.token, 'buy')}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg"
                        >
                          Invest More
                        </button>
                        <button
                          onClick={() => openTradeModal(holding.token, 'sell')}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <CollectionDashboard
            holdings={holdings}
            holdDaysMap={MOCK_COLLECTION_DATA.holdDaysMap}
            maxMultiple={MOCK_COLLECTION_DATA.maxMultiple}
            survivedDumps={MOCK_COLLECTION_DATA.survivedDumps}
            selectedCardBack={selectedCardBack}
            onCardBackSelect={setSelectedCardBack}
          />
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Battle Stats */}
            <BattleStatsCard stats={MOCK_BATTLE_STATS} />

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/arena" className="surface-panel hover:ring-2 hover:ring-botanical-500 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">⚔️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Enter Arena</h3>
                    <p className="text-sm text-muted">Battle other investors with your portfolio</p>
                  </div>
                </div>
              </Link>

              <Link href="/leaderboard" className="surface-panel hover:ring-2 hover:ring-botanical-500 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Leaderboard</h3>
                    <p className="text-sm text-muted">See where you rank globally</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Mini Leaderboards */}
            <div className="grid md:grid-cols-2 gap-6">
              <LeaderboardDisplay type="hands" limit={5} />
              <LeaderboardDisplay type="battle" limit={5} />
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            {watchedTokens.length === 0 ? (
              <div className="surface-panel text-center py-12">
                <div className="text-4xl mb-4">&#11088;</div>
                <p className="text-muted mb-4">Your watchlist is empty</p>
                <p className="text-sm text-muted mb-6">
                  Add apps to your watchlist to track their performance
                </p>
                <Link href="/marketplace" className="btn btn-primary">
                  Browse Apps
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {watchedTokens.map((token) => (
                  <div key={token.id} className="surface-panel">
                    <div className="flex items-center gap-6">
                      {/* Mini Card */}
                      <div className="flex-shrink-0">
                        <PlayingCard
                          rank={getRankFromScore(token.score) as any}
                          suit={getSuitForCategory(token.category)}
                          size="sm"
                          flippable={false}
                        />
                      </div>

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/marketplace/${token.id}`}
                          className="font-semibold hover:text-botanical-600 transition-colors"
                        >
                          {token.name}
                        </Link>
                        <p className="text-muted text-sm">{token.symbol}</p>
                        <p className="text-xs text-muted mt-1">{token.category}</p>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold">${token.price.toFixed(4)}</p>
                        <p className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                        </p>
                      </div>

                      {/* Performance */}
                      <div className="text-right">
                        <p className="text-muted text-sm">Performance</p>
                        <p className="text-xl font-bold">{token.score}</p>
                      </div>

                      {/* Watchlist Button */}
                      <WatchlistButton tokenId={token.id} size="md" />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openTradeModal(token, 'buy')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg"
                        >
                          Invest
                        </button>
                        <button
                          onClick={() => openTradeModal(token, 'sell')}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="surface-panel">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-botanical-200">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-4 flex items-center gap-4">
                    {/* Type Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium
                      ${tx.type === 'buy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.type === 'buy' ? 'Invested' : 'Sold'}
                    </div>

                    {/* Token */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/marketplace/${tx.tokenId}`}
                        className="font-semibold hover:text-botanical-600"
                      >
                        {tx.token.name}
                      </Link>
                      <p className="text-muted text-sm">
                        {tx.amount.toLocaleString()} {tx.token.symbol} @ ${tx.price.toFixed(4)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'buy' ? 'text-red-500' : 'text-green-600'}`}>
                        {tx.type === 'buy' ? '-' : '+'}${tx.total.toFixed(2)}
                      </p>
                      <p className="text-muted text-xs">Fee: ${tx.fee.toFixed(2)}</p>
                    </div>

                    {/* Date */}
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm">{formatDate(tx.timestamp)}</p>
                      <p className="text-muted text-xs">{formatTime(tx.timestamp)}</p>
                    </div>

                    {/* Tx Hash */}
                    <a
                      href={`https://chainscan-newton.0g.ai/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-botanical-600 hover:underline"
                    >
                      {shortenHash(tx.txHash)}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-8">
            {/* Unlocked */}
            <div>
              <h3 className="heading-3 mb-4">Unlocked ({unlockedAchievements.length})</h3>
              {unlockedAchievements.length === 0 ? (
                <div className="surface-panel text-center py-8">
                  <p className="text-muted">No achievements unlocked yet. Start trading!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`surface-panel border-2 ${RARITY_COLORS[achievement.rarity]}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize
                              ${RARITY_COLORS[achievement.rarity]}`}
                            >
                              {achievement.rarity}
                            </span>
                          </div>
                          <p className="text-muted text-sm mt-1">{achievement.description}</p>
                          <p className="text-xs text-muted mt-2">
                            Unlocked {formatDate(achievement.unlockedAt!)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locked */}
            <div>
              <h3 className="heading-3 mb-4">In Progress ({lockedAchievements.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="surface-panel opacity-70 border border-botanical-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl grayscale">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize border
                            ${RARITY_COLORS[achievement.rarity]}`}
                          >
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-muted text-sm mt-1">{achievement.description}</p>

                        {/* Progress Bar */}
                        {achievement.progress !== undefined && achievement.maxProgress && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <div className="h-2 bg-botanical-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-botanical-500 transition-all"
                                style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trade Modal */}
      {selectedToken && (
        <TradeModal
          token={selectedToken}
          isOpen={!!selectedToken}
          onClose={() => setSelectedToken(null)}
          initialType={tradeType}
          userHoldings={userTokens}
        />
      )}
    </div>
  );
}

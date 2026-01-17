'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { AppCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import type { Suit, Rank } from '@/components/design-system';
import { TradeModal, GraduationProgress, FeeSummary } from '@/components/trading';
import { PriceChart } from '@/components/charts';
import { WatchlistButton } from '@/components/watchlist';
import { generatePriceHistory } from '@/lib/mock-data';
import { FEE_CONFIG } from '@/lib/fees';
import type { Token } from '@/lib/mock-data';

function formatNumber(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(2)}`;
}

export default function TokenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  const openTradeModal = (type: 'buy' | 'sell') => {
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch(`/api/tokens/${id}`);
        if (!res.ok) {
          setError('Token not found');
          return;
        }
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        setError('Failed to load token');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [id]);

  // Generate price history for chart (memoized to prevent regeneration)
  // Must be called before any early returns to maintain hooks order
  const priceHistory = useMemo(() => {
    if (!token) return [];
    return generatePriceHistory(token.price, 90, 0.08);
  }, [token]);

  // Derived values that depend on token
  const suit = token ? getSuitForCategory(token.category) : 'spades';
  const rank = token ? getRankFromScore(token.score) : '2';

  if (loading) {
    return (
      <div className="botanical-bg min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="surface-panel text-center py-12">
            <p className="text-muted">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="botanical-bg min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="surface-panel text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Token not found'}</p>
            <Link href="/marketplace" className="btn btn-primary">
              Back to Marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/marketplace" className="text-muted hover:text-botanical-600">
            Marketplace
          </Link>
          <span className="mx-2 text-muted">/</span>
          <span>{token.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="surface-panel flex flex-col items-center justify-center py-8">
            <AppCard
              name={token.name}
              symbol={token.symbol}
              imageUrl={token.logo}
              rank={rank as Rank}
              suit={suit as Suit}
              price={token.price}
              priceChange={token.priceChange24h}
              size="xl"
              showPrice={false}
            />
          </div>

          {/* Token Details */}
          <div className="space-y-6">
            {/* Header */}
            <div className="surface-panel">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="heading-1 text-2xl sm:text-3xl">{token.name}</h1>
                  <p className="text-muted">{token.symbol}</p>
                </div>
                <div className="flex items-center gap-3">
                  <WatchlistButton tokenId={token.id} size="lg" showText />
                  <span className="px-3 py-1 bg-botanical-100 rounded-full text-sm font-medium">
                    {token.category}
                  </span>
                </div>
              </div>
              <p className="text-muted text-sm sm:text-base">{token.description}</p>
            </div>

            {/* Price Stats */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Price Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted text-sm">Price</p>
                  <p className="text-2xl font-bold">${token.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted text-sm">24h Change</p>
                  <p
                    className={`text-2xl font-bold ${
                      token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {token.priceChange24h >= 0 ? '+' : ''}
                    {token.priceChange24h.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted text-sm">Market Cap</p>
                  <p className="text-xl font-semibold">{formatNumber(token.marketCap)}</p>
                </div>
                <div>
                  <p className="text-muted text-sm">24h Volume</p>
                  <p className="text-xl font-semibold">{formatNumber(token.volume24h)}</p>
                </div>
              </div>
            </div>

            {/* Graduation Progress */}
            <GraduationProgress currentMarketCap={token.marketCap} />

            {/* Price Chart */}
            <PriceChart data={priceHistory} symbol={token.symbol} />

            {/* Card Rank */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Card Rank</h3>
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl font-bold">{rank}</p>
                  <p className="text-muted text-xs sm:text-sm">Rank</p>
                </div>
                <div className="h-10 sm:h-12 w-px bg-botanical-200" />
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl">
                    {suit === 'diamonds' && '♦'}
                    {suit === 'spades' && '♠'}
                    {suit === 'clubs' && '♣'}
                    {suit === 'hearts' && '♥'}
                  </p>
                  <p className="text-muted text-xs sm:text-sm capitalize">{suit}</p>
                </div>
                <div className="h-10 sm:h-12 w-px bg-botanical-200" />
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl font-bold">{token.score}</p>
                  <p className="text-muted text-xs sm:text-sm">Score</p>
                </div>
              </div>
              <p className="text-muted text-xs mt-4">
                Score = 40% price change + 30% volume + 30% holders
              </p>
            </div>

            {/* Community */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Community</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted text-sm">Holders</p>
                  <p className="text-xl font-semibold">{token.holders.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted text-sm">Created</p>
                  <p className="text-xl font-semibold">{token.createdAt}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={() => openTradeModal('buy')}
                  className="btn btn-primary flex-1 text-sm sm:text-base py-3"
                >
                  Buy {token.symbol}
                </button>
                <button
                  onClick={() => openTradeModal('sell')}
                  className="btn btn-secondary flex-1 text-sm sm:text-base py-3"
                >
                  Sell {token.symbol}
                </button>
              </div>
              <p className="text-xs text-muted text-center">
                {FEE_CONFIG.trading.total / 100}% trading fee • {FEE_CONFIG.trading.creator / 100}% goes to creator
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Trade Modal */}
      <TradeModal
        token={token}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        initialType={tradeType}
      />
    </div>
  );
}

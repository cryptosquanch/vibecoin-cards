'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import { TradeModal } from '@/components/trading';
import { WalletPanel } from '@/components/wallet';
import type { Suit } from '@/components/design-system';
import type { Token } from '@/lib/mock-data';

type Category = 'all' | 'AI' | 'DeFi' | 'Gaming' | 'Creator';
type SortBy = 'score' | 'price' | 'volume' | 'priceChange' | 'holders';

const CATEGORIES: { value: Category; label: string; suit?: Suit; symbol?: string; pillClass: string }[] = [
  { value: 'all', label: 'All Apps', pillClass: 'suit-pill-all' },
  { value: 'AI', label: 'AI', suit: 'diamonds', symbol: '♦', pillClass: 'suit-pill-red' },
  { value: 'DeFi', label: 'DeFi', suit: 'spades', symbol: '♠', pillClass: 'suit-pill-ink' },
  { value: 'Gaming', label: 'Gaming', suit: 'clubs', symbol: '♣', pillClass: 'suit-pill-ink' },
  { value: 'Creator', label: 'Creator', suit: 'hearts', symbol: '♥', pillClass: 'suit-pill-red' },
];

const RANK_LADDER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'score', label: 'Top Performing' },
  { value: 'priceChange', label: 'Trending' },
  { value: 'volume', label: 'Most Investment' },
  { value: 'holders', label: 'Most Owners' },
  { value: 'price', label: 'Share Price' },
];

export default function MarketplacePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  // Filter tokens by search query
  const filteredTokens = tokens.filter(token => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.description.toLowerCase().includes(query)
    );
  });

  const openTradeModal = (token: Token, type: 'buy' | 'sell', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedToken(token);
    setTradeType(type);
  };

  useEffect(() => {
    async function fetchTokens() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        params.set('sortBy', sortBy);
        params.set('order', 'desc');

        const res = await fetch(`/api/tokens?${params}`);
        const data = await res.json();
        setTokens(data.tokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [category, sortBy]);

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="heading-1 mb-2">App Marketplace</h1>
              <p className="text-muted">
                Discover apps to invest in and earn revenue share. Each card represents your ownership stake&mdash;higher performing apps earn higher card ranks.
              </p>
            </div>

        {/* Search */}
        <div className="surface-panel mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name, category, or description..."
              className="w-full pl-12 pr-4 py-3 bg-botanical-50 border border-botanical-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-botanical-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-botanical-100 rounded"
              >
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters with Suit-Colored Pills */}
        <div className="surface-panel mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            {/* Category Filter - Suit-Colored Pills */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`suit-pill ${cat.pillClass} ${category === cat.value ? 'active' : ''}`}
                >
                  {cat.symbol && <span>{cat.symbol}</span>}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown and Result Count */}
            <div className="flex items-center gap-4">
              {searchQuery && (
                <span className="text-sm text-muted">
                  {filteredTokens.length} result{filteredTokens.length !== 1 ? 's' : ''}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted text-sm">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-botanical-100 border border-botanical-200 rounded-lg px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rank Ladder Strip */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-medium">Rank Scale:</span>
            <div className="rank-ladder">
              {RANK_LADDER.map((rank, index) => (
                <span
                  key={rank}
                  className={`rank-ladder-item ${index < 4 ? 'face-card' : ''}`}
                >
                  {rank}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted">Higher rank = Better performance</span>
          </div>
        </div>

        {/* Token Grid with Tabletop Texture */}
        {loading ? (
          <div className="surface-panel text-center py-12">
            <p className="text-muted">Loading apps...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="surface-panel text-center py-12">
            {searchQuery ? (
              <>
                <p className="text-muted mb-2">No apps found for &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-botanical-600 hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <p className="text-muted">No apps found</p>
            )}
          </div>
        ) : (
          <div className="tabletop-felt">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredTokens.map((token, index) => (
                <div
                  key={token.id}
                  className={`card-grid-item group relative animate-fade-in-up animation-delay-${Math.min((index % 8) + 1, 5) * 100}`}
                >
                  <Link href={`/marketplace/${token.id}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <PlayingCard
                          rank={getRankFromScore(token.score) as any}
                          suit={getSuitForCategory(token.category)}
                          size="lg"
                          flippable={false}
                          backVariant="botanical"
                        />

                        {/* Quick Trade Buttons - appear on hover */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                          <button
                            onClick={(e) => openTradeModal(token, 'buy', e)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg"
                          >
                            Invest
                          </button>
                          <button
                            onClick={(e) => openTradeModal(token, 'sell', e)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow-lg"
                          >
                            Sell
                          </button>
                        </div>
                      </div>

                      {/* Token Info with Price Chip */}
                      <div className="text-center w-full">
                        <p className="font-semibold group-hover:text-botanical-600 transition-colors">
                          {token.name}
                        </p>
                        <p className="text-muted text-sm mb-2">{token.symbol}</p>

                        {/* Price Chip */}
                        <div className={`price-chip inline-flex ${token.priceChange24h >= 0 ? 'price-chip-positive' : 'price-chip-negative'}`}>
                          <span className="font-semibold">${token.price.toFixed(2)}</span>
                          <span className={token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>

          {/* Wallet Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <WalletPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Trade Modal */}
      {selectedToken && (
        <TradeModal
          token={selectedToken}
          isOpen={!!selectedToken}
          onClose={() => setSelectedToken(null)}
          initialType={tradeType}
        />
      )}
    </div>
  );
}

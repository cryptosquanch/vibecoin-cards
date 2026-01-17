'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Header } from '@/components/layout';
import { PlayingCard, getSuitForCategory, getRankFromScore } from '@/components/design-system';
import type { Token } from '@/lib/mock-data';

export default function HomePage() {
  const [featuredTokens, setFeaturedTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const { login, authenticated } = usePrivy();

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch('/api/tokens?limit=4&sortBy=score');
        const data = await res.json();
        setFeaturedTokens(data.tokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTokens();
  }, []);

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="heading-1 text-5xl md:text-6xl mb-6">
            Own the Apps You Love<br />
            <span className="text-botanical-500">Earn What They Earn</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Invest in your favorite apps and earn revenue share. Each card represents your stake
            in real projects&mdash;not speculation, but ownership with real returns.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/marketplace" className="btn btn-primary text-lg px-8 py-3">
              Explore Apps
            </Link>
            <Link href="/how-it-works" className="btn btn-secondary text-lg px-8 py-3">
              How It Works
            </Link>
          </div>
        </div>

        {/* Featured Cards Fan with Spotlight */}
        <div className="hero-spotlight flex justify-center items-end mb-16">
          {!loading && featuredTokens.slice(0, 4).map((token, index) => {
            // Stagger rotation: center cards more upright, edges tilt more
            const fanAngles = [-18, -6, 6, 18];
            const rotation = fanAngles[index] || 0;
            const lift = index === 1 || index === 2 ? 8 : 0; // Center cards slightly lifted

            return (
              <div
                key={token.id}
                className={`card-fan-item transform transition-all duration-300 hover:scale-110 hover:-translate-y-6 animate-fade-in-up animation-delay-${(index + 1) * 100}`}
                style={{
                  transform: `rotate(${rotation}deg) translateY(-${lift}px)`,
                  marginLeft: index > 0 ? '-35px' : '0',
                  zIndex: index < 2 ? index : 4 - index,
                }}
              >
                <Link href={`/marketplace/${token.id}`}>
                  <PlayingCard
                    rank={getRankFromScore(token.score) as any}
                    suit={getSuitForCategory(token.category)}
                    size="lg"
                    flippable={false}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Suits Section */}
      <section className="bg-botanical-50/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="heading-2 text-center mb-12">Four Categories, Four Ways to Earn</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { category: 'AI', suit: 'diamonds', symbol: '♦', flora: 'AI Agents & Tools', color: 'text-red-500' },
              { category: 'DeFi', suit: 'spades', symbol: '♠', flora: 'Financial Apps', color: 'text-gray-800' },
              { category: 'Gaming', suit: 'clubs', symbol: '♣', flora: 'Games & Metaverse', color: 'text-gray-800' },
              { category: 'Creator', suit: 'hearts', symbol: '♥', flora: 'Creator Platforms', color: 'text-red-500' },
            ].map((item) => (
              <div key={item.category} className="surface-panel text-center">
                <span className={`text-5xl ${item.color}`}>{item.symbol}</span>
                <h3 className="heading-3 mt-4">{item.category}</h3>
                <p className="text-muted text-sm mt-2">{item.flora}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="heading-2 text-center mb-12">How You Earn</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="surface-panel text-center">
            <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="heading-3 mb-2">Pick Apps You Love</h3>
            <p className="text-muted text-sm">
              Browse real apps across AI, DeFi, Gaming, and Creator categories. Each card represents a stake in the project.
            </p>
          </div>
          <div className="surface-panel text-center">
            <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="heading-3 mb-2">Own Your Share</h3>
            <p className="text-muted text-sm">
              Higher-performing apps earn face cards (A, K, Q, J). Your card rank reflects real app performance and revenue.
            </p>
          </div>
          <div className="surface-panel text-center">
            <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="heading-3 mb-2">Earn Revenue Share</h3>
            <p className="text-muted text-sm">
              As apps generate revenue, you earn your share. Build a portfolio that pays you back.
            </p>
          </div>
        </div>
      </section>

      {/* Top Tokens Preview */}
      <section className="bg-botanical-50/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="heading-2">Top Performing Apps</h2>
            <Link href="/marketplace" className="btn btn-secondary">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="surface-panel text-center py-12">
              <p className="text-muted">Loading tokens...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredTokens.map((token) => (
                <Link
                  key={token.id}
                  href={`/marketplace/${token.id}`}
                  className="surface-panel group hover:border-botanical-500 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <PlayingCard
                        rank={getRankFromScore(token.score) as any}
                        suit={getSuitForCategory(token.category)}
                        size="sm"
                        flippable={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate group-hover:text-botanical-600">
                        {token.name}
                      </p>
                      <p className="text-muted text-sm">{token.symbol}</p>
                      <p className="text-sm font-medium">${token.price.toFixed(2)}</p>
                      <p
                        className={`text-xs ${
                          token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Portfolio Snapshot Band */}
      {authenticated && !loading && featuredTokens.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="portfolio-snapshot">
            <div className="portfolio-cards-mini">
              {featuredTokens.slice(0, 4).map((token, index) => (
                <div key={token.id} style={{ zIndex: 4 - index }}>
                  <PlayingCard
                    rank={getRankFromScore(token.score) as any}
                    suit={getSuitForCategory(token.category)}
                    size="sm"
                    flippable={false}
                  />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted mb-1">Your Portfolio</p>
              <p className="font-semibold">4 Apps Owned</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted mb-1">Est. Monthly Revenue</p>
              <p className="text-xl font-bold text-green-600">$127.50</p>
            </div>
            <Link href="/profile" className="btn btn-primary">
              View Portfolio
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="heading-2 mb-4">Ready to Own What You Use?</h2>
        <p className="text-muted mb-8 max-w-xl mx-auto">
          Connect your wallet and start building a portfolio of apps that pay you back.
        </p>
        {authenticated ? (
          <Link href="/marketplace" className="btn btn-primary text-lg px-8 py-3">
            Browse Apps
          </Link>
        ) : (
          <button onClick={login} className="btn btn-primary text-lg px-8 py-3">
            Connect Wallet
          </button>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted">
          <p>Vibecoin &mdash; Own the Apps You Love</p>
          <p className="text-sm mt-2">Powered by 0G Blockchain</p>
        </div>
      </footer>
    </div>
  );
}

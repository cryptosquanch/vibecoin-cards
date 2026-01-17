'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import {
  PlayingCard,
  CardDeck,
  CATEGORY_SUITS,
  AchievementBadge,
  ACHIEVEMENTS,
  getSuitForCategory,
  getRankFromScore,
  generateDeck,
} from '@/components/design-system';
import type { Suit, Rank, AchievementId, CardBackVariant } from '@/components/design-system';

const SUITS: Suit[] = ['diamonds', 'hearts', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const BACK_VARIANTS: CardBackVariant[] = ['botanical', 'logo', 'pattern'];

// Mock token data
const MOCK_TOKENS = [
  { name: 'NeuroAI', category: 'AI', score: 92, logo: null },
  { name: 'SwapFi', category: 'DeFi', score: 78, logo: null },
  { name: 'PixelQuest', category: 'Gaming', score: 65, logo: null },
  { name: 'ArtVerse', category: 'Creator', score: 45, logo: null },
];

export default function DesignSystemDemo() {
  const [selectedSuit, setSelectedSuit] = useState<Suit>('diamonds');
  const [selectedRank, setSelectedRank] = useState<Rank>('A');
  const [selectedBack, setSelectedBack] = useState<CardBackVariant>('botanical');
  const [deckFilterSuit, setDeckFilterSuit] = useState<Suit | 'all'>('all');
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementId[]>([
    'be-bleeding-edge',
    'roll-the-dice',
    'brand-new',
    'act-now',
    'pay-me',
  ]);

  const toggleAchievement = (id: AchievementId) => {
    setUnlockedAchievements((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Token Cards - Marketplace Preview */}
        <section>
          <h2 className="heading-2 mb-6">Token Cards (Marketplace)</h2>
          <p className="text-muted mb-6">
            Each token displayed as a playing card. Rank based on daily composite score (price +
            volume + holders). Click cards to flip and see back designs.
          </p>

          <div className="surface-panel">
            <div className="flex flex-wrap gap-6 justify-center">
              {MOCK_TOKENS.map((token) => (
                <div key={token.name} className="flex flex-col items-center gap-3">
                  <PlayingCard
                    rank={getRankFromScore(token.score)}
                    suit={getSuitForCategory(token.category)}
                    size="lg"
                    flippable
                    backVariant={selectedBack}
                    tokenName={token.name}
                  />
                  <div className="text-center">
                    <p className="font-semibold">{token.name}</p>
                    <p className="text-muted text-sm">
                      {token.category} · Score: {token.score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Card Back Variants */}
        <section>
          <h2 className="heading-2 mb-6">Card Back Designs</h2>
          <div className="surface-panel">
            <div className="flex gap-4 mb-6">
              {BACK_VARIANTS.map((variant) => (
                <button
                  key={variant}
                  onClick={() => setSelectedBack(variant)}
                  className={`btn ${selectedBack === variant ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-muted text-sm">
              Selected: <strong>{selectedBack}</strong> - Click any token card above to see the back
            </p>
          </div>
        </section>

        {/* Category Suit Mapping */}
        <section>
          <h2 className="heading-2 mb-6">Category → Suit Mapping</h2>
          <div className="surface-panel">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(CATEGORY_SUITS).map(([category, suit]) => (
                <div key={category} className="flex items-center gap-4">
                  <PlayingCard rank="A" suit={suit} size="sm" flippable backVariant="botanical" />
                  <div>
                    <p className="font-semibold">{category}</p>
                    <p className="text-muted text-sm capitalize">{suit}</p>
                    <p className="text-xs text-muted">
                      {suit === 'diamonds' && 'Lotus'}
                      {suit === 'spades' && 'Olive'}
                      {suit === 'clubs' && 'Clover'}
                      {suit === 'hearts' && 'Cherry Blossom'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Card Builder */}
        <section>
          <h2 className="heading-2 mb-6">Card Builder</h2>
          <div className="surface-panel">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium mb-2">Suit</label>
                  <div className="flex gap-2">
                    {SUITS.map((suit) => (
                      <button
                        key={suit}
                        onClick={() => setSelectedSuit(suit)}
                        className={`btn ${selectedSuit === suit ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {suit === 'diamonds' && '♦'}
                        {suit === 'hearts' && '♥'}
                        {suit === 'clubs' && '♣'}
                        {suit === 'spades' && '♠'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rank (based on score)</label>
                  <div className="flex flex-wrap gap-2">
                    {RANKS.map((rank) => (
                      <button
                        key={rank}
                        onClick={() => setSelectedRank(rank)}
                        className={`btn ${selectedRank === rank ? 'btn-primary' : 'btn-secondary'} min-w-[40px]`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <PlayingCard
                  rank={selectedRank}
                  suit={selectedSuit}
                  size="xl"
                  flippable
                  backVariant={selectedBack}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Full 52-Card Deck */}
        <section>
          <h2 className="heading-2 mb-6">Full 52-Card Deck</h2>
          <p className="text-muted mb-6">
            Dynamically generated playing cards using the botanical design system. Filter by suit or view all 52 cards.
          </p>

          <div className="surface-panel">
            {/* Suit filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setDeckFilterSuit('all')}
                className={`btn ${deckFilterSuit === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All (52)
              </button>
              {SUITS.map((suit) => (
                <button
                  key={suit}
                  onClick={() => setDeckFilterSuit(suit)}
                  className={`btn ${deckFilterSuit === suit ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {suit === 'diamonds' && '♦ Diamonds'}
                  {suit === 'hearts' && '♥ Hearts'}
                  {suit === 'clubs' && '♣ Clubs'}
                  {suit === 'spades' && '♠ Spades'}
                </button>
              ))}
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-13 gap-3">
              {generateDeck()
                .filter((card) => deckFilterSuit === 'all' || card.suit === deckFilterSuit)
                .map(({ rank, suit }) => (
                  <PlayingCard
                    key={`${rank}-${suit}`}
                    rank={rank}
                    suit={suit}
                    size="sm"
                    flippable
                    backVariant={selectedBack}
                  />
                ))}
            </div>

            <p className="text-muted text-sm mt-4">
              {deckFilterSuit === 'all'
                ? '52 cards total • Click any card to flip'
                : `13 ${deckFilterSuit} cards • Click any card to flip`}
            </p>
          </div>
        </section>

        {/* Achievement Badges */}
        <section>
          <h2 className="heading-2 mb-6">Achievement Badges (12 Tattoo Flash Sprites)</h2>
          <p className="text-muted mb-6">Click badges to toggle unlock state</p>

          <div className="surface-panel">
            <div className="grid grid-cols-4 gap-6">
              {(Object.keys(ACHIEVEMENTS) as AchievementId[]).map((id) => (
                <AchievementBadge
                  key={id}
                  achievementId={id}
                  size="lg"
                  unlocked={unlockedAchievements.includes(id)}
                  showLabel
                  onClick={() => toggleAchievement(id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Badge Size Variants */}
        <section>
          <h2 className="heading-2 mb-6">Badge Sizes</h2>
          <div className="surface-panel">
            <div className="flex items-end gap-8 flex-wrap">
              <div className="text-center">
                <AchievementBadge achievementId="be-bleeding-edge" size="sm" showLabel />
                <p className="text-muted text-sm mt-2">Small</p>
              </div>
              <div className="text-center">
                <AchievementBadge achievementId="roll-the-dice" size="md" showLabel />
                <p className="text-muted text-sm mt-2">Medium</p>
              </div>
              <div className="text-center">
                <AchievementBadge achievementId="pay-me" size="lg" showLabel />
                <p className="text-muted text-sm mt-2">Large</p>
              </div>
              <div className="text-center">
                <AchievementBadge achievementId="act-now" size="xl" showLabel />
                <p className="text-muted text-sm mt-2">XL</p>
              </div>
            </div>
          </div>
        </section>

        {/* Score to Rank Mapping */}
        <section>
          <h2 className="heading-2 mb-6">Score → Rank Mapping</h2>
          <div className="surface-panel">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center text-sm">
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">A</span>
                <p className="text-muted">95-100</p>
              </div>
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">K</span>
                <p className="text-muted">90-94</p>
              </div>
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">Q</span>
                <p className="text-muted">85-89</p>
              </div>
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">J</span>
                <p className="text-muted">80-84</p>
              </div>
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">10</span>
                <p className="text-muted">70-79</p>
              </div>
              <div className="p-3 rounded bg-botanical-100">
                <span className="font-bold text-lg">9-2</span>
                <p className="text-muted">&lt;70</p>
              </div>
            </div>
            <p className="text-muted text-sm mt-4">
              Composite score = 40% price change + 30% volume + 30% holder count (daily snapshot)
            </p>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="heading-2 mb-6">Buttons</h2>
          <div className="surface-panel">
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-ghost">Ghost</button>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="heading-2 mb-6">Typography</h2>
          <div className="surface-panel space-y-4">
            <h1 className="heading-1">Heading 1 - Fraunces</h1>
            <h2 className="heading-2">Heading 2 - Fraunces</h2>
            <h3 className="heading-3">Heading 3 - Fraunces</h3>
            <p>Body text - Inter. The quick brown fox jumps over the lazy dog.</p>
            <p className="text-muted">Muted text for secondary information.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted">
          <p>Vibecoin Playing Card Design System</p>
          <p className="text-sm mt-2">Ready to apply to vibecoin-launchpad marketplace</p>
        </div>
      </footer>
    </div>
  );
}

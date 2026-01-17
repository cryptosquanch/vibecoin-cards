'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Design tokens from botanical-card.jsonc
const DESIGN_TOKENS = {
  color: {
    primary: {
      // Vermilion / red-orange - for red suits (diamonds, hearts)
      500: '#E45239',
      600: '#C94832',
      700: '#AB3E2B',
    },
    secondary: {
      // Sage / muted green - for leaf fills
      500: '#939F8F',
    },
    grays: {
      paper: '#F1F1EC',
      paperMuted: '#E5E4DE',
      ink: '#2F3129', // For black suits (clubs, spades)
      inkMuted: '#5D6158',
      surfaceCharcoal: '#2E2B2A',
    },
  },
  spacing: {
    cornerInsetX: 0.06, // 6% from sides
    cornerInsetY: 0.04, // 4% from top/bottom
    diamondInset: 0.10, // 10% outline diamond inset
    illustrationInset: 0.14, // 14% botanical bounds
  },
};

// Suit configuration with colors and flora images
const SUITS = {
  diamonds: {
    symbol: '♦',
    flora: 'Lotus',
    floraImage: '/assets/flora/lotus-diamonds.jpg',
    color: DESIGN_TOKENS.color.primary[500], // Red
    isRed: true,
  },
  hearts: {
    symbol: '♥',
    flora: 'Cherry Blossom',
    floraImage: '/assets/flora/cherry-blossom-hearts.jpg',
    color: DESIGN_TOKENS.color.primary[500], // Red
    isRed: true,
  },
  clubs: {
    symbol: '♣',
    flora: 'Clover',
    floraImage: '/assets/flora/clover-clubs.jpg',
    color: DESIGN_TOKENS.color.grays.ink, // Black
    isRed: false,
  },
  spades: {
    symbol: '♠',
    flora: 'Olive',
    floraImage: '/assets/flora/olive-spades.jpg',
    color: DESIGN_TOKENS.color.grays.ink, // Black
    isRed: false,
  },
} as const;

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

// Face card images (J, Q, K)
const FACE_CARDS: Record<string, Record<string, string>> = {
  J: {
    diamonds: '/assets/faces/jack-diamonds.jpg',
    hearts: '/assets/faces/jack-hearts.jpg',
    clubs: '/assets/faces/jack-clubs.jpg',
    spades: '/assets/faces/jack-spades.jpg',
  },
  Q: {
    diamonds: '/assets/faces/queen-diamonds.jpg',
    hearts: '/assets/faces/queen-hearts.jpg',
    clubs: '/assets/faces/queen-clubs.jpg',
    spades: '/assets/faces/queen-spades.jpg',
  },
  K: {
    diamonds: '/assets/faces/king-diamonds.jpg',
    hearts: '/assets/faces/king-hearts.jpg',
    clubs: '/assets/faces/king-clubs.jpg',
    spades: '/assets/faces/king-spades.jpg',
  },
};

// Number card images (A-10) with botanical designs
const NUMBER_CARDS: Record<string, Record<string, string>> = {
  A: {
    diamonds: '/assets/numbers/ace-diamonds.jpg',
    hearts: '/assets/numbers/ace-hearts.jpg',
    clubs: '/assets/numbers/ace-clubs.jpg',
    spades: '/assets/numbers/ace-spades.jpg',
  },
  '2': {
    diamonds: '/assets/numbers/2-diamonds.jpg',
    hearts: '/assets/numbers/2-hearts.jpg',
    clubs: '/assets/numbers/2-clubs.jpg',
    spades: '/assets/numbers/2-spades.jpg',
  },
  '3': {
    diamonds: '/assets/numbers/3-diamonds.jpg',
    hearts: '/assets/numbers/3-hearts.jpg',
    clubs: '/assets/numbers/3-clubs.jpg',
    spades: '/assets/numbers/3-spades.jpg',
  },
  '4': {
    diamonds: '/assets/numbers/4-diamonds.jpg',
    hearts: '/assets/numbers/4-hearts.jpg',
    clubs: '/assets/numbers/4-clubs.jpg',
    spades: '/assets/numbers/4-spades.jpg',
  },
  '5': {
    diamonds: '/assets/numbers/5-diamonds.jpg',
    hearts: '/assets/numbers/5-hearts.jpg',
    clubs: '/assets/numbers/5-clubs.jpg',
    spades: '/assets/numbers/5-spades.jpg',
  },
  '6': {
    diamonds: '/assets/numbers/6-diamonds.jpg',
    hearts: '/assets/numbers/6-hearts.jpg',
    clubs: '/assets/numbers/6-clubs.jpg',
    spades: '/assets/numbers/6-spades.jpg',
  },
  '7': {
    diamonds: '/assets/numbers/7-diamonds.jpg',
    hearts: '/assets/numbers/7-hearts.jpg',
    clubs: '/assets/numbers/7-clubs.jpg',
    spades: '/assets/numbers/7-spades.jpg',
  },
  '8': {
    diamonds: '/assets/numbers/8-diamonds.jpg',
    hearts: '/assets/numbers/8-hearts.jpg',
    clubs: '/assets/numbers/8-clubs.jpg',
    spades: '/assets/numbers/8-spades.jpg',
  },
  '9': {
    diamonds: '/assets/numbers/9-diamonds.jpg',
    hearts: '/assets/numbers/9-hearts.jpg',
    clubs: '/assets/numbers/9-clubs.jpg',
    spades: '/assets/numbers/9-spades.jpg',
  },
  '10': {
    diamonds: '/assets/numbers/10-diamonds.jpg',
    hearts: '/assets/numbers/10-hearts.jpg',
    clubs: '/assets/numbers/10-clubs.jpg',
    spades: '/assets/numbers/10-spades.jpg',
  },
};

function isFaceCard(rank: string): boolean {
  return rank === 'J' || rank === 'Q' || rank === 'K';
}

function getCardImage(rank: string, suit: string): string | null {
  // Check face cards first (J, Q, K)
  if (isFaceCard(rank) && FACE_CARDS[rank]) {
    return FACE_CARDS[rank][suit] || null;
  }
  // Check number cards (A-10)
  if (NUMBER_CARDS[rank]) {
    return NUMBER_CARDS[rank][suit] || null;
  }
  return null;
}

export type Suit = keyof typeof SUITS;
export type Rank = (typeof RANKS)[number];
export type CardBackVariant = 'botanical' | 'logo' | 'pattern';

interface PlayingCardProps {
  rank: Rank;
  suit: Suit;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  flippable?: boolean;
  backVariant?: CardBackVariant;
  tokenName?: string;
  tokenLogo?: string;
  showBotanical?: boolean; // Show botanical center illustration
}

// Card dimensions maintain 5:7 aspect ratio like real playing cards
const sizeConfig = {
  sm: { width: 100, height: 140 },
  md: { width: 150, height: 210 },
  lg: { width: 200, height: 280 },
  xl: { width: 280, height: 392 },
};

export function PlayingCard({
  rank,
  suit,
  className = '',
  size = 'md',
  onClick,
  flippable = false,
  backVariant = 'botanical',
  tokenName,
  tokenLogo,
  showBotanical = true,
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const config = sizeConfig[size];
  const suitConfig = SUITS[suit];

  const handleClick = () => {
    if (flippable) {
      setIsFlipped(!isFlipped);
    }
    onClick?.();
  };

  // Calculate responsive font sizes based on card size
  const rankFontSize = config.height * 0.08;
  const suitFontSize = config.height * 0.06;

  return (
    <div
      className={`${className}`}
      style={{
        width: config.width,
        height: config.height,
        perspective: '1000px',
      }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onClick={handleClick}
        whileHover={!isFlipped ? { scale: 1.02, y: -4 } : undefined}
        whileTap={{ scale: 0.98 }}
      >
        {/* Card Front - Full card image */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            boxShadow: '0 8px 20px rgba(46, 43, 42, 0.25)',
            backgroundColor: DESIGN_TOKENS.color.grays.paper,
          }}
        >
          {/* Full card image - includes corners and botanical design */}
          {showBotanical && (
            <Image
              src={getCardImage(rank, suit) || suitConfig.floraImage}
              alt={`${rank} of ${suit}`}
              fill
              className="object-contain"
              sizes={`${config.width}px`}
            />
          )}

          {/* Overlay for token info if provided */}
          {tokenName && (
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-[15%]">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {tokenLogo && (
                  <div className="relative w-8 h-8 mx-auto mb-1">
                    <Image src={tokenLogo} alt={tokenName} fill className="object-contain" />
                  </div>
                )}
                <span className="text-white text-xs font-semibold">{tokenName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Back */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: '0 8px 20px rgba(46, 43, 42, 0.25)',
          }}
        >
          <CardBack variant={backVariant} />
        </div>
      </motion.div>
    </div>
  );
}

// Card Back Component - 3 variants
function CardBack({ variant }: { variant: CardBackVariant }) {
  if (variant === 'botanical') {
    return (
      <div className="relative w-full h-full">
        <Image
          src="/assets/card-back.jpg"
          alt="Card back"
          fill
          className="object-cover"
        />
        {/* Inner border */}
        <div className="absolute inset-[6px] border-2 border-[#D2BB66]/40 rounded-md" />
      </div>
    );
  }

  if (variant === 'logo') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-[#2F7F3E] to-[#155124]">
        {/* Inner border */}
        <div className="absolute inset-[6px] border-2 border-[#D2BB66]/40 rounded-md" />
        {/* Center V logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#D2BB66] font-display text-4xl font-bold">V</span>
        </div>
      </div>
    );
  }

  // Pattern variant - diagonal stripes
  return (
    <div
      className="relative w-full h-full"
      style={{
        background: `
          linear-gradient(135deg, #2F7F3E 25%, transparent 25%),
          linear-gradient(225deg, #2F7F3E 25%, transparent 25%),
          linear-gradient(45deg, #2F7F3E 25%, transparent 25%),
          linear-gradient(315deg, #2F7F3E 25%, #1F6A2F 25%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 0, 10px -10px, 0px 10px',
      }}
    >
      {/* Inner border */}
      <div className="absolute inset-[6px] border-2 border-[#D2BB66]/40 rounded-md" />
    </div>
  );
}

// Category to Suit mapping
export const CATEGORY_SUITS: Record<string, Suit> = {
  AI: 'diamonds',
  DeFi: 'spades',
  Gaming: 'clubs',
  Creator: 'hearts',
};

export function getSuitForCategory(category: string): Suit {
  return CATEGORY_SUITS[category] || 'diamonds';
}

// Score to Rank mapping (composite score 0-100)
export function getRankFromScore(score: number): Rank {
  if (score >= 95) return 'A';
  if (score >= 90) return 'K';
  if (score >= 85) return 'Q';
  if (score >= 80) return 'J';
  if (score >= 70) return '10';
  if (score >= 60) return '9';
  if (score >= 50) return '8';
  if (score >= 40) return '7';
  if (score >= 30) return '6';
  if (score >= 20) return '5';
  if (score >= 15) return '4';
  if (score >= 10) return '3';
  return '2';
}

// Generate full 52-card deck
export function generateDeck(): Array<{ rank: Rank; suit: Suit }> {
  const deck: Array<{ rank: Rank; suit: Suit }> = [];
  const suits: Suit[] = ['diamonds', 'hearts', 'clubs', 'spades'];

  for (const suit of suits) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

// Card Deck Display Component
interface CardDeckProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showAll?: boolean;
  filterSuit?: Suit;
  className?: string;
}

export function CardDeck({
  size = 'md',
  showAll = true,
  filterSuit,
  className = '',
}: CardDeckProps) {
  const deck = generateDeck();
  const filteredDeck = filterSuit
    ? deck.filter((card) => card.suit === filterSuit)
    : deck;

  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
      {(showAll ? filteredDeck : filteredDeck.slice(0, 4)).map(({ rank, suit }) => (
        <PlayingCard
          key={`${rank}-${suit}`}
          rank={rank}
          suit={suit}
          size={size}
          flippable
        />
      ))}
    </div>
  );
}

// Export design tokens for use elsewhere
export { DESIGN_TOKENS, SUITS, RANKS };

export default PlayingCard;

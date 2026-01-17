'use client';

import { useState } from 'react';
import Image from 'next/image';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

interface AppCardProps {
  name: string;
  symbol: string;
  imageUrl?: string | null;
  rank: Rank;
  suit: Suit;
  price: number;
  priceChange: number;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
  className?: string;
}

// Get suit symbol and color
function getSuitInfo(suit: Suit) {
  switch (suit) {
    case 'hearts':
      return { symbol: '♥', color: 'text-red-500', bg: 'bg-red-500' };
    case 'diamonds':
      return { symbol: '♦', color: 'text-red-500', bg: 'bg-red-500' };
    case 'clubs':
      return { symbol: '♣', color: 'text-gray-800 dark:text-gray-200', bg: 'bg-gray-800' };
    case 'spades':
      return { symbol: '♠', color: 'text-gray-800 dark:text-gray-200', bg: 'bg-gray-800' };
  }
}

// Size configurations
const sizeConfig = {
  sm: {
    container: 'w-32',
    image: 'h-24',
    badge: 'text-xs px-1.5 py-0.5',
    name: 'text-sm',
    symbol: 'text-xs',
    price: 'text-xs',
  },
  md: {
    container: 'w-40',
    image: 'h-32',
    badge: 'text-sm px-2 py-1',
    name: 'text-base',
    symbol: 'text-sm',
    price: 'text-sm',
  },
  lg: {
    container: 'w-48',
    image: 'h-40',
    badge: 'text-base px-2.5 py-1',
    name: 'text-lg',
    symbol: 'text-sm',
    price: 'text-base',
  },
};

// Generate placeholder gradient based on name
function getPlaceholderGradient(name: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-yellow-500 to-orange-500',
    'from-teal-500 to-cyan-500',
    'from-rose-500 to-pink-500',
  ];

  // Simple hash based on name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function AppCard({
  name,
  symbol,
  imageUrl,
  rank,
  suit,
  price,
  priceChange,
  size = 'md',
  showPrice = true,
  className = '',
}: AppCardProps) {
  const [imageError, setImageError] = useState(false);
  const suitInfo = getSuitInfo(suit);
  const config = sizeConfig[size];
  const gradient = getPlaceholderGradient(name);

  return (
    <div className={`${config.container} ${className}`}>
      {/* Card Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-botanical-200 dark:border-gray-700 group">
        {/* Image Area */}
        <div className={`${config.image} relative overflow-hidden`}>
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            // Placeholder with gradient and first letter
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-4xl font-bold text-white/90 drop-shadow-lg">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Rank Badge - Top Right Corner */}
          <div className={`absolute top-2 right-2 ${config.badge} rounded-lg font-bold shadow-lg flex items-center gap-0.5 ${
            suit === 'hearts' || suit === 'diamonds'
              ? 'bg-white text-red-500'
              : 'bg-white text-gray-800'
          }`}>
            <span>{rank}</span>
            <span className={suitInfo.color}>{suitInfo.symbol}</span>
          </div>

          {/* Category Indicator - Bottom Left */}
          <div className={`absolute bottom-2 left-2 w-6 h-6 rounded-full ${suitInfo.bg} flex items-center justify-center shadow-md`}>
            <span className="text-white text-sm">{suitInfo.symbol}</span>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-3">
          <h3 className={`${config.name} font-semibold truncate group-hover:text-botanical-600 transition-colors`}>
            {name}
          </h3>
          <p className={`${config.symbol} text-muted truncate`}>{symbol}</p>

          {showPrice && (
            <div className="mt-2 flex items-center justify-between">
              <span className={`${config.price} font-semibold`}>
                ${price.toFixed(2)}
              </span>
              <span className={`${config.price} font-medium ${
                priceChange >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions to get suit and rank from token data
export function getSuitForCategory(category: string): Suit {
  switch (category) {
    case 'AI': return 'diamonds';
    case 'DeFi': return 'spades';
    case 'Gaming': return 'clubs';
    case 'Creator': return 'hearts';
    default: return 'spades';
  }
}

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

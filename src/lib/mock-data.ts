// Mock token data for the Vibecoin marketplace
// Categories map to suits: AI=Diamonds, DeFi=Spades, Gaming=Clubs, Creator=Hearts

export interface Token {
  id: string;
  name: string;
  symbol: string;
  category: 'AI' | 'DeFi' | 'Gaming' | 'Creator';
  description: string;
  logo: string | null;
  score: number; // 0-100 composite score (price + volume + holders)
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  marketCap: number;
  createdAt: string;
  creator: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string | null;
}

export const MOCK_TOKENS: Token[] = [
  {
    id: 'neuroai',
    name: 'NeuroAI',
    symbol: 'NEUR',
    category: 'AI',
    description: 'Decentralized AI inference network powered by 0G storage',
    logo: '/logos/neuroai.svg',
    score: 92,
    price: 2.45,
    priceChange24h: 12.5,
    volume24h: 1250000,
    holders: 4500,
    marketCap: 24500000,
    createdAt: '2024-01-15',
    creator: '0x1234...5678',
  },
  {
    id: 'swapfi',
    name: 'SwapFi',
    symbol: 'SWAP',
    category: 'DeFi',
    description: 'Lightning-fast DEX built on 0G with sub-second finality',
    logo: '/logos/swapfi.svg',
    score: 78,
    price: 0.85,
    priceChange24h: -3.2,
    volume24h: 890000,
    holders: 2800,
    marketCap: 8500000,
    createdAt: '2024-02-20',
    creator: '0xabcd...ef01',
  },
  {
    id: 'pixelquest',
    name: 'PixelQuest',
    symbol: 'PXLQ',
    category: 'Gaming',
    description: 'Play-to-earn RPG with on-chain game state stored on 0G',
    logo: '/logos/pixelquest.svg',
    score: 65,
    price: 0.12,
    priceChange24h: 8.7,
    volume24h: 320000,
    holders: 12000,
    marketCap: 1200000,
    createdAt: '2024-03-01',
    creator: '0x9876...5432',
  },
  {
    id: 'artverse',
    name: 'ArtVerse',
    symbol: 'ARTV',
    category: 'Creator',
    description: 'NFT marketplace for AI-generated art stored on 0G',
    logo: '/logos/artverse.svg',
    score: 45,
    price: 0.03,
    priceChange24h: -1.5,
    volume24h: 45000,
    holders: 800,
    marketCap: 300000,
    createdAt: '2024-03-10',
    creator: '0xfedc...ba98',
  },
  {
    id: 'defiking',
    name: 'DeFi King',
    symbol: 'DFKG',
    category: 'DeFi',
    description: 'Yield aggregator optimizing across 0G DeFi protocols',
    logo: '/logos/defiking.svg',
    score: 88,
    price: 5.20,
    priceChange24h: 4.3,
    volume24h: 2100000,
    holders: 3200,
    marketCap: 52000000,
    createdAt: '2024-01-25',
    creator: '0x2468...1357',
  },
  {
    id: 'cognichain',
    name: 'CogniChain',
    symbol: 'COGN',
    category: 'AI',
    description: 'On-chain machine learning models with verifiable compute',
    logo: '/logos/cognichain.svg',
    score: 71,
    price: 0.95,
    priceChange24h: 15.2,
    volume24h: 680000,
    holders: 1900,
    marketCap: 9500000,
    createdAt: '2024-02-05',
    creator: '0x1357...2468',
  },
  {
    id: 'battleblocks',
    name: 'BattleBlocks',
    symbol: 'BBLK',
    category: 'Gaming',
    description: 'Fully on-chain strategy game with 0G-powered replays',
    logo: '/logos/battleblocks.svg',
    score: 82,
    price: 0.45,
    priceChange24h: 22.1,
    volume24h: 890000,
    holders: 8500,
    marketCap: 4500000,
    createdAt: '2024-02-28',
    creator: '0xaaaa...bbbb',
  },
  {
    id: 'melodymint',
    name: 'MelodyMint',
    symbol: 'MELO',
    category: 'Creator',
    description: 'Music NFTs with royalty streaming on 0G',
    logo: '/logos/melodymint.svg',
    score: 55,
    price: 0.08,
    priceChange24h: 6.8,
    volume24h: 120000,
    holders: 1500,
    marketCap: 800000,
    createdAt: '2024-03-05',
    creator: '0xcccc...dddd',
  },
];

// Get category for a token
export function getTokenCategory(category: Token['category']): 'diamonds' | 'spades' | 'clubs' | 'hearts' {
  switch (category) {
    case 'AI': return 'diamonds';
    case 'DeFi': return 'spades';
    case 'Gaming': return 'clubs';
    case 'Creator': return 'hearts';
  }
}

// Get rank from score
export function getRankFromScore(score: number): string {
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

// Price history type
export interface PricePoint {
  timestamp: string;
  price: number;
  volume: number;
}

// Generate mock price history for a token
export function generatePriceHistory(
  basePrice: number,
  days: number = 30,
  volatility: number = 0.05
): PricePoint[] {
  const history: PricePoint[] = [];
  let price = basePrice * (1 - volatility * days / 2); // Start lower
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random price movement with slight upward bias
    const change = (Math.random() - 0.45) * volatility * price;
    price = Math.max(price + change, basePrice * 0.1);

    history.push({
      timestamp: date.toISOString(),
      price: parseFloat(price.toFixed(4)),
      volume: Math.floor(Math.random() * 500000) + 50000,
    });
  }

  return history;
}

// User portfolio types
export interface Holding {
  tokenId: string;
  amount: number;
  avgBuyPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  tokenId: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  timestamp: string;
  txHash: string;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string | null;
  progress?: number;
  maxProgress?: number;
}

// Mock user portfolio data
export const MOCK_HOLDINGS: Holding[] = [
  {
    tokenId: 'neuroai',
    amount: 500,
    avgBuyPrice: 2.10,
    currentValue: 1225,
    pnl: 175,
    pnlPercent: 16.67,
  },
  {
    tokenId: 'defiking',
    amount: 100,
    avgBuyPrice: 4.80,
    currentValue: 520,
    pnl: 40,
    pnlPercent: 8.33,
  },
  {
    tokenId: 'battleblocks',
    amount: 2000,
    avgBuyPrice: 0.38,
    currentValue: 900,
    pnl: 140,
    pnlPercent: 18.42,
  },
  {
    tokenId: 'cognichain',
    amount: 300,
    avgBuyPrice: 1.05,
    currentValue: 285,
    pnl: -30,
    pnlPercent: -9.52,
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    type: 'buy',
    tokenId: 'neuroai',
    amount: 200,
    price: 2.35,
    total: 470,
    fee: 4.70,
    timestamp: '2024-03-15T14:30:00Z',
    txHash: '0x1234567890abcdef1234567890abcdef12345678',
  },
  {
    id: 'tx2',
    type: 'buy',
    tokenId: 'battleblocks',
    amount: 1000,
    price: 0.40,
    total: 400,
    fee: 4.00,
    timestamp: '2024-03-14T10:15:00Z',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  {
    id: 'tx3',
    type: 'sell',
    tokenId: 'swapfi',
    amount: 500,
    price: 0.90,
    total: 450,
    fee: 4.50,
    timestamp: '2024-03-13T16:45:00Z',
    txHash: '0x567890abcdef1234567890abcdef1234567890ab',
  },
  {
    id: 'tx4',
    type: 'buy',
    tokenId: 'defiking',
    amount: 100,
    price: 4.80,
    total: 480,
    fee: 4.80,
    timestamp: '2024-03-12T09:00:00Z',
    txHash: '0xcdef1234567890abcdef1234567890abcdef1234',
  },
  {
    id: 'tx5',
    type: 'buy',
    tokenId: 'neuroai',
    amount: 300,
    price: 1.95,
    total: 585,
    fee: 5.85,
    timestamp: '2024-03-10T11:20:00Z',
    txHash: '0x90abcdef1234567890abcdef1234567890abcdef',
  },
];

// Top traders mock data
export interface Trader {
  rank: number;
  address: string;
  pnl: number;
  pnlPercent: number;
  tradesCount: number;
  winRate: number;
  topHolding: string; // token symbol
}

export const MOCK_TOP_TRADERS: Trader[] = [
  {
    rank: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    pnl: 45280,
    pnlPercent: 234.5,
    tradesCount: 156,
    winRate: 72.4,
    topHolding: 'NEUR',
  },
  {
    rank: 2,
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    pnl: 32150,
    pnlPercent: 189.2,
    tradesCount: 98,
    winRate: 68.1,
    topHolding: 'DFKG',
  },
  {
    rank: 3,
    address: '0x567890abcdef1234567890abcdef1234567890ab',
    pnl: 28900,
    pnlPercent: 156.8,
    tradesCount: 234,
    winRate: 65.3,
    topHolding: 'BBLK',
  },
  {
    rank: 4,
    address: '0xcdef1234567890abcdef1234567890abcdef1234',
    pnl: 21750,
    pnlPercent: 142.1,
    tradesCount: 87,
    winRate: 71.2,
    topHolding: 'COGN',
  },
  {
    rank: 5,
    address: '0x90abcdef1234567890abcdef1234567890abcdef',
    pnl: 18420,
    pnlPercent: 128.5,
    tradesCount: 145,
    winRate: 62.8,
    topHolding: 'NEUR',
  },
  {
    rank: 6,
    address: '0x2468135724681357246813572468135724681357',
    pnl: 15680,
    pnlPercent: 112.3,
    tradesCount: 67,
    winRate: 74.6,
    topHolding: 'SWAP',
  },
  {
    rank: 7,
    address: '0x1357246813572468135724681357246813572468',
    pnl: 12340,
    pnlPercent: 98.7,
    tradesCount: 112,
    winRate: 59.1,
    topHolding: 'PXLQ',
  },
  {
    rank: 8,
    address: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
    pnl: 9870,
    pnlPercent: 85.4,
    tradesCount: 89,
    winRate: 63.4,
    topHolding: 'MELO',
  },
  {
    rank: 9,
    address: '0xbbbb2222cccc3333dddd4444eeee5555ffff6666',
    pnl: 7650,
    pnlPercent: 72.1,
    tradesCount: 156,
    winRate: 55.8,
    topHolding: 'ARTV',
  },
  {
    rank: 10,
    address: '0xcccc3333dddd4444eeee5555ffff6666aaaa7777',
    pnl: 5420,
    pnlPercent: 58.9,
    tradesCount: 45,
    winRate: 68.9,
    topHolding: 'DFKG',
  },
];

export const MOCK_USER_ACHIEVEMENTS: UserAchievement[] = [
  {
    id: 'first-trade',
    name: 'First Trade',
    description: 'Complete your first token trade',
    icon: '🎯',
    rarity: 'common',
    unlockedAt: '2024-03-10T11:20:00Z',
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    description: 'Hold a token for 30 days without selling',
    icon: '💎',
    rarity: 'rare',
    unlockedAt: null,
    progress: 15,
    maxProgress: 30,
  },
  {
    id: 'whale-watcher',
    name: 'Whale Watcher',
    description: 'Own tokens worth over $1,000',
    icon: '🐋',
    rarity: 'rare',
    unlockedAt: '2024-03-14T10:15:00Z',
  },
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Hold tokens from all 4 categories',
    icon: '🃏',
    rarity: 'epic',
    unlockedAt: null,
    progress: 3,
    maxProgress: 4,
  },
  {
    id: 'ace-collector',
    name: 'Ace Collector',
    description: 'Own a token ranked Ace (95+ score)',
    icon: '🏆',
    rarity: 'legendary',
    unlockedAt: null,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Buy a token within 24 hours of launch',
    icon: '🐦',
    rarity: 'epic',
    unlockedAt: '2024-03-01T08:00:00Z',
  },
];

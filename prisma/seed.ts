import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';

// Create Prisma adapter with libSQL config
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

// Initial token data with custom SVG logos
const INITIAL_TOKENS = [
  {
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
    creatorAddress: '0x1234567890abcdef1234567890abcdef12345678',
  },
  {
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
    creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  {
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
    creatorAddress: '0x9876543210fedcba9876543210fedcba98765432',
  },
  {
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
    creatorAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
  },
  {
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
    creatorAddress: '0x2468135724681357246813572468135724681357',
  },
  {
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
    creatorAddress: '0x1357246813572468135724681357246813572468',
  },
  {
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
    creatorAddress: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
  },
  {
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
    creatorAddress: '0xcccc3333dddd4444eeee5555ffff6666aaaa7777',
  },
];

// Initial achievements
const INITIAL_ACHIEVEMENTS = [
  {
    name: 'First Trade',
    description: 'Complete your first token trade',
    icon: '🎯',
    rarity: 'common',
    requirement: JSON.stringify({ type: 'trade_count', value: 1 }),
  },
  {
    name: 'Diamond Hands',
    description: 'Hold a token for 30 days without selling',
    icon: '💎',
    rarity: 'rare',
    requirement: JSON.stringify({ type: 'hold_days', value: 30 }),
  },
  {
    name: 'Whale Watcher',
    description: 'Own tokens worth over $1,000',
    icon: '🐋',
    rarity: 'rare',
    requirement: JSON.stringify({ type: 'portfolio_value', value: 1000 }),
  },
  {
    name: 'Diversified',
    description: 'Hold tokens from all 4 categories',
    icon: '🃏',
    rarity: 'epic',
    requirement: JSON.stringify({ type: 'category_count', value: 4 }),
  },
  {
    name: 'Ace Collector',
    description: 'Own a token ranked Ace (95+ score)',
    icon: '🏆',
    rarity: 'legendary',
    requirement: JSON.stringify({ type: 'rank', value: 'A' }),
  },
  {
    name: 'Early Bird',
    description: 'Buy a token within 24 hours of launch',
    icon: '🐦',
    rarity: 'epic',
    requirement: JSON.stringify({ type: 'early_buy_hours', value: 24 }),
  },
  {
    name: 'Battle Champion',
    description: 'Win 10 portfolio battles',
    icon: '⚔️',
    rarity: 'epic',
    requirement: JSON.stringify({ type: 'battle_wins', value: 10 }),
  },
  {
    name: 'Revenue King',
    description: 'Earn $100 in revenue share payouts',
    icon: '👑',
    rarity: 'legendary',
    requirement: JSON.stringify({ type: 'total_payouts', value: 100 }),
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in reverse order of dependencies
  console.log('Clearing existing data...');
  try {
    await prisma.userAchievement.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.payout.deleteMany();
    await prisma.priceHistory.deleteMany();
    await prisma.battle.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Note: Some tables may not exist yet, continuing...');
  }

  // Seed tokens
  console.log('Seeding tokens...');
  for (const token of INITIAL_TOKENS) {
    await prisma.token.create({
      data: token,
    });
  }
  console.log(`✓ Created ${INITIAL_TOKENS.length} tokens`);

  // Seed achievements
  console.log('Seeding achievements...');
  for (const achievement of INITIAL_ACHIEVEMENTS) {
    await prisma.achievement.create({
      data: achievement,
    });
  }
  console.log(`✓ Created ${INITIAL_ACHIEVEMENTS.length} achievements`);

  // Generate price history for each token (last 30 days)
  console.log('Generating price history...');
  const tokens = await prisma.token.findMany();
  const now = new Date();

  for (const token of tokens) {
    let price = token.price * (1 - 0.05 * 15); // Start 15 days worth of volatility lower
    const priceHistory = [];

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random price movement with slight upward bias
      const change = (Math.random() - 0.45) * 0.05 * price;
      price = Math.max(price + change, token.price * 0.1);

      priceHistory.push({
        tokenId: token.id,
        price: parseFloat(price.toFixed(4)),
        volume: Math.floor(Math.random() * 500000) + 50000,
        timestamp: date,
      });
    }

    await prisma.priceHistory.createMany({
      data: priceHistory,
    });
  }
  console.log(`✓ Generated price history for ${tokens.length} tokens`);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

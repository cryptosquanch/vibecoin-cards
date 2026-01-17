/**
 * Vibecoin Platform Fee System
 *
 * Revenue Streams:
 * 1. Trading Fee (1%) - Split between platform, creator, referrer
 * 2. Graduation Fee (2%) - When token graduates to DEX
 * 3. Launch Fee (0.01 ETH or free with $VIBE stake)
 * 4. Featured Listing (0.1 ETH / 24 hours)
 */

// Fee rates as basis points (1 bp = 0.01%)
export const FEE_CONFIG = {
  // Trading fees (total 1% = 100 basis points)
  trading: {
    total: 100, // 1%
    platform: 50, // 0.5% to treasury
    creator: 30, // 0.3% to token creator
    referrer: 20, // 0.2% to referrer (if any)
  },

  // Graduation fee (2% of market cap at graduation)
  graduation: {
    total: 200, // 2%
    platform: 100, // 1% to treasury
    burn: 100, // 1% buy & burn $VIBE
  },

  // Launch fee in ETH
  launch: {
    standard: 0.01, // 0.01 ETH
    withVibeStake: 0, // Free if staking 1000 $VIBE
    vibeStakeRequired: 1000,
  },

  // Featured listing in ETH per 24 hours
  featured: {
    perDay: 0.1,
    perWeek: 0.5, // 30% discount
  },

  // $VIBE holder discounts
  vibeDiscounts: {
    tier1: { minStake: 100, discount: 10 }, // 10% off fees
    tier2: { minStake: 500, discount: 25 }, // 25% off fees
    tier3: { minStake: 1000, discount: 50 }, // 50% off fees
  },

  // Graduation threshold
  graduationThreshold: 69000, // $69K market cap
} as const;

// Fee recipient addresses (would be real addresses in production)
export const FEE_RECIPIENTS = {
  treasury: '0x1234...treasury',
  burnAddress: '0x0000...dead',
} as const;

export interface FeeBreakdown {
  subtotal: number;
  platformFee: number;
  creatorFee: number;
  referrerFee: number;
  totalFees: number;
  total: number;
  // For display
  platformFeePercent: number;
  creatorFeePercent: number;
  referrerFeePercent: number;
  totalFeePercent: number;
  // Discount info
  vibeDiscount: number;
  handDiscount: number;
  totalDiscount: number;
  savingsAmount: number;
}

export interface TradeParams {
  amount: number; // Token amount
  price: number; // Price per token
  type: 'buy' | 'sell';
  hasReferrer?: boolean;
  vibeStaked?: number; // Amount of $VIBE staked by user
  handDiscount?: number; // Discount from poker hand (0-50%)
  creatorAddress?: string;
  referrerAddress?: string;
}

/**
 * Calculate discount based on $VIBE stake
 */
export function getVibeDiscount(vibeStaked: number): number {
  const { vibeDiscounts } = FEE_CONFIG;

  if (vibeStaked >= vibeDiscounts.tier3.minStake) {
    return vibeDiscounts.tier3.discount;
  }
  if (vibeStaked >= vibeDiscounts.tier2.minStake) {
    return vibeDiscounts.tier2.discount;
  }
  if (vibeStaked >= vibeDiscounts.tier1.minStake) {
    return vibeDiscounts.tier1.discount;
  }
  return 0;
}

/**
 * Calculate combined discount from $VIBE stake and poker hand
 * Discounts stack additively up to a max of 75%
 */
export function getTotalDiscount(vibeStaked: number, handDiscount: number): {
  vibeDiscount: number;
  handDiscount: number;
  totalDiscount: number;
} {
  const vibeDiscount = getVibeDiscount(vibeStaked);
  // Cap total discount at 75%
  const totalDiscount = Math.min(vibeDiscount + handDiscount, 75);
  return { vibeDiscount, handDiscount, totalDiscount };
}

/**
 * Calculate fee breakdown for a trade
 */
export function calculateTradeFees(params: TradeParams): FeeBreakdown {
  const { amount, price, type, hasReferrer = false, vibeStaked = 0, handDiscount = 0 } = params;
  const subtotal = amount * price;

  // Get combined discount from $VIBE staking and poker hand
  const discounts = getTotalDiscount(vibeStaked, handDiscount);
  const discountMultiplier = (100 - discounts.totalDiscount) / 100;

  // Calculate base fees (in basis points)
  const { trading } = FEE_CONFIG;

  // Calculate what fees WOULD be without discount (for savings display)
  const basePlatformBps = hasReferrer ? trading.platform : trading.platform + trading.referrer;
  const baseFeeBps = basePlatformBps + trading.creator + (hasReferrer ? trading.referrer : 0);
  const baseFeeAmount = (subtotal * baseFeeBps) / 10000;

  // Apply discount to platform fee only (creator and referrer fees stay same)
  const platformBps = trading.platform * discountMultiplier;
  const creatorBps = trading.creator;
  const referrerBps = hasReferrer ? trading.referrer : 0;

  // If no referrer, their share goes to platform (also discounted)
  const adjustedPlatformBps = hasReferrer ? platformBps : platformBps + (trading.referrer * discountMultiplier);

  // Convert basis points to actual amounts
  const platformFee = (subtotal * adjustedPlatformBps) / 10000;
  const creatorFee = (subtotal * creatorBps) / 10000;
  const referrerFee = hasReferrer ? (subtotal * referrerBps) / 10000 : 0;
  const totalFees = platformFee + creatorFee + referrerFee;

  // Calculate savings from discounts
  const savingsAmount = baseFeeAmount - totalFees;

  // Total depends on trade type
  // Buy: user pays subtotal + fees
  // Sell: user receives subtotal - fees
  const total = type === 'buy' ? subtotal + totalFees : subtotal - totalFees;

  return {
    subtotal,
    platformFee,
    creatorFee,
    referrerFee,
    totalFees,
    total,
    platformFeePercent: adjustedPlatformBps / 100,
    creatorFeePercent: creatorBps / 100,
    referrerFeePercent: referrerBps / 100,
    totalFeePercent: (adjustedPlatformBps + creatorBps + referrerBps) / 100,
    vibeDiscount: discounts.vibeDiscount,
    handDiscount: discounts.handDiscount,
    totalDiscount: discounts.totalDiscount,
    savingsAmount,
  };
}

/**
 * Calculate graduation fees
 */
export function calculateGraduationFees(marketCap: number): {
  platformFee: number;
  burnAmount: number;
  totalFee: number;
} {
  const { graduation } = FEE_CONFIG;

  const platformFee = (marketCap * graduation.platform) / 10000;
  const burnAmount = (marketCap * graduation.burn) / 10000;
  const totalFee = platformFee + burnAmount;

  return {
    platformFee,
    burnAmount,
    totalFee,
  };
}

/**
 * Check if token is ready to graduate
 */
export function isReadyToGraduate(marketCap: number): boolean {
  return marketCap >= FEE_CONFIG.graduationThreshold;
}

/**
 * Calculate launch fee
 */
export function calculateLaunchFee(vibeStaked: number): number {
  const { launch } = FEE_CONFIG;

  if (vibeStaked >= launch.vibeStakeRequired) {
    return launch.withVibeStake;
  }
  return launch.standard;
}

/**
 * Format fee for display
 */
export function formatFee(amount: number): string {
  if (amount < 0.01) return '<$0.01';
  return `$${amount.toFixed(2)}`;
}

/**
 * Format percentage for display
 */
export function formatFeePercent(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

// Platform statistics tracking (would be from blockchain in production)
export interface PlatformStats {
  totalVolume: number;
  totalTrades: number;
  totalFeesCollected: number;
  totalCreatorEarnings: number;
  totalReferrerEarnings: number;
  totalBurned: number;
  totalGraduations: number;
  totalLaunches: number;
}

// Mock platform stats
export const MOCK_PLATFORM_STATS: PlatformStats = {
  totalVolume: 2450000,
  totalTrades: 15420,
  totalFeesCollected: 24500,
  totalCreatorEarnings: 7350,
  totalReferrerEarnings: 4900,
  totalBurned: 8625,
  totalGraduations: 23,
  totalLaunches: 156,
};

// Creator earnings tracking
export interface CreatorEarnings {
  tokenId: string;
  totalVolume: number;
  totalEarnings: number;
  tradeCount: number;
  lastEarningAt: string;
}

// Mock creator earnings for tokens
export const MOCK_CREATOR_EARNINGS: Record<string, CreatorEarnings> = {
  'neural-nexus': {
    tokenId: 'neural-nexus',
    totalVolume: 450000,
    totalEarnings: 1350, // 0.3% of volume
    tradeCount: 2340,
    lastEarningAt: '2025-01-17T10:30:00Z',
  },
  'defi-dragon': {
    tokenId: 'defi-dragon',
    totalVolume: 320000,
    totalEarnings: 960,
    tradeCount: 1820,
    lastEarningAt: '2025-01-17T09:45:00Z',
  },
  'pixel-punks': {
    tokenId: 'pixel-punks',
    totalVolume: 180000,
    totalEarnings: 540,
    tradeCount: 980,
    lastEarningAt: '2025-01-17T08:20:00Z',
  },
};

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Token reviews enable social proof and community curation:
 * 1. Users rate tokens with 1-5 stars + written review
 * 2. Reviews are weighted by user level & stake tier
 * 3. "Helpful" votes surface quality reviews
 * 4. XP rewards for writing and voting on reviews
 *
 * Anti-spam: Min level 3 to review, rate limits apply
 * ─────────────────────────────────────────────────
 */

export interface TokenReview {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  authorAddress: string;
  authorUsername: string;
  authorLevel: number;
  authorTier?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  recommendation: 'buy' | 'hold' | 'avoid' | 'neutral';
  helpfulVotes: number;
  unhelpfulVotes: number;
  votedAddresses: string[];
  verified: boolean; // Has the author actually held the token?
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  buyRecommendations: number;
  holdRecommendations: number;
  avoidRecommendations: number;
  neutralRecommendations: number;
}

export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful';
export type RecommendationType = 'buy' | 'hold' | 'avoid' | 'neutral';

// XP rewards for review actions
export const REVIEW_XP_REWARDS = {
  write_review: 50,
  receive_helpful: 5,
  vote_on_review: 2,
  first_review_bonus: 25,
  verified_holder_bonus: 15,
};

// Rating display config
export const RATING_CONFIG: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: 'Poor', color: 'text-red-500', emoji: '😞' },
  2: { label: 'Below Average', color: 'text-orange-500', emoji: '😐' },
  3: { label: 'Average', color: 'text-yellow-500', emoji: '😊' },
  4: { label: 'Good', color: 'text-lime-500', emoji: '😄' },
  5: { label: 'Excellent', color: 'text-green-500', emoji: '🤩' },
};

export const RECOMMENDATION_CONFIG: Record<RecommendationType, { label: string; color: string; bg: string; icon: string }> = {
  buy: { label: 'Buy', color: 'text-green-600', bg: 'bg-green-100', icon: '🚀' },
  hold: { label: 'Hold', color: 'text-blue-600', bg: 'bg-blue-100', icon: '💎' },
  avoid: { label: 'Avoid', color: 'text-red-600', bg: 'bg-red-100', icon: '⚠️' },
  neutral: { label: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-100', icon: '🤔' },
};

// Calculate weighted average rating (verified & high-level users count more)
export function calculateWeightedRating(reviews: TokenReview[]): number {
  if (reviews.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  reviews.forEach(review => {
    // Base weight of 1
    let weight = 1;

    // Verified holders get +0.5 weight
    if (review.verified) weight += 0.5;

    // Higher level users get more weight (up to +1)
    weight += Math.min(review.authorLevel / 30, 1);

    // Reviews with more helpful votes get more weight
    const netHelpful = review.helpfulVotes - review.unhelpfulVotes;
    if (netHelpful > 0) weight += Math.min(netHelpful / 10, 0.5);

    totalWeight += weight;
    weightedSum += review.rating * weight;
  });

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

// Generate review stats for a token
export function calculateReviewStats(reviews: TokenReview[]): ReviewStats {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let buyCount = 0, holdCount = 0, avoidCount = 0, neutralCount = 0;

  reviews.forEach(review => {
    distribution[review.rating]++;
    switch (review.recommendation) {
      case 'buy': buyCount++; break;
      case 'hold': holdCount++; break;
      case 'avoid': avoidCount++; break;
      case 'neutral': neutralCount++; break;
    }
  });

  return {
    totalReviews: reviews.length,
    averageRating: calculateWeightedRating(reviews),
    ratingDistribution: distribution,
    buyRecommendations: buyCount,
    holdRecommendations: holdCount,
    avoidRecommendations: avoidCount,
    neutralRecommendations: neutralCount,
  };
}

// Sort reviews
export function sortReviews(reviews: TokenReview[], sort: ReviewSortOption): TokenReview[] {
  const sorted = [...reviews];

  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating);
    case 'most_helpful':
      return sorted.sort((a, b) => (b.helpfulVotes - b.unhelpfulVotes) - (a.helpfulVotes - a.unhelpfulVotes));
    default:
      return sorted;
  }
}

// Create a new review
export function createReview(
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  author: { address: string; username: string; level: number; tier?: string },
  data: { rating: 1 | 2 | 3 | 4 | 5; title: string; content: string; pros?: string[]; cons?: string[]; recommendation: RecommendationType },
  verified: boolean
): TokenReview {
  return {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tokenId,
    tokenName,
    tokenSymbol,
    authorAddress: author.address,
    authorUsername: author.username,
    authorLevel: author.level,
    authorTier: author.tier,
    rating: data.rating,
    title: data.title,
    content: data.content,
    pros: data.pros,
    cons: data.cons,
    recommendation: data.recommendation,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    votedAddresses: [],
    verified,
    createdAt: new Date().toISOString(),
  };
}

// Mock reviews for demo
export const MOCK_REVIEWS: TokenReview[] = [
  {
    id: 'rev-1',
    tokenId: 'ai-nexus',
    tokenName: 'AI Nexus',
    tokenSymbol: 'AINEX',
    authorAddress: '0xAAA...BBB',
    authorUsername: 'CryptoSage',
    authorLevel: 24,
    authorTier: 'Gold',
    rating: 5,
    title: 'Revolutionary AI token with real utility',
    content: 'AI Nexus has completely transformed how I think about AI agent tokens. The team delivers consistently and the community is incredibly supportive. Been holding since day 1 and not selling anytime soon.',
    pros: ['Strong team', 'Active development', 'Great community', 'Real utility'],
    cons: ['Gas fees can be high during peak'],
    recommendation: 'buy',
    helpfulVotes: 42,
    unhelpfulVotes: 3,
    votedAddresses: [],
    verified: true,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'rev-2',
    tokenId: 'ai-nexus',
    tokenName: 'AI Nexus',
    tokenSymbol: 'AINEX',
    authorAddress: '0xCCC...DDD',
    authorUsername: 'DeFiDegen',
    authorLevel: 18,
    authorTier: 'Silver',
    rating: 4,
    title: 'Solid project, waiting for more features',
    content: 'Good fundamentals and the bonding curve mechanism is innovative. Would love to see more integrations with other protocols. Holding for now.',
    pros: ['Innovative mechanics', 'Fair launch'],
    cons: ['Limited integrations', 'Docs could be better'],
    recommendation: 'hold',
    helpfulVotes: 28,
    unhelpfulVotes: 5,
    votedAddresses: [],
    verified: true,
    createdAt: '2025-01-18T14:20:00Z',
  },
  {
    id: 'rev-3',
    tokenId: 'meme-lord',
    tokenName: 'Meme Lord',
    tokenSymbol: 'MEMELORD',
    authorAddress: '0xEEE...FFF',
    authorUsername: 'MemeKing',
    authorLevel: 12,
    rating: 3,
    title: 'Fun meme token but risky',
    content: 'Classic meme token with a fun community. Not financial advice but only put in what you can afford to lose. The memes are top tier though!',
    pros: ['Great memes', 'Active Telegram'],
    cons: ['High volatility', 'No real utility'],
    recommendation: 'neutral',
    helpfulVotes: 15,
    unhelpfulVotes: 8,
    votedAddresses: [],
    verified: false,
    createdAt: '2025-01-19T08:45:00Z',
  },
  {
    id: 'rev-4',
    tokenId: 'scam-token',
    tokenName: 'SafeMoon 3.0',
    tokenSymbol: 'SAFE3',
    authorAddress: '0x111...222',
    authorUsername: 'RugDetector',
    authorLevel: 30,
    authorTier: 'Platinum',
    rating: 1,
    title: '⚠️ WARNING: Classic rug pull signs',
    content: 'Multiple red flags here. Anonymous team, no audit, liquidity not locked, and suspicious tokenomics. Stay away! This is not FUD, just protecting the community.',
    pros: [],
    cons: ['Anonymous team', 'No audit', 'Liquidity unlocked', 'Suspicious activity'],
    recommendation: 'avoid',
    helpfulVotes: 156,
    unhelpfulVotes: 12,
    votedAddresses: [],
    verified: false,
    createdAt: '2025-01-17T16:00:00Z',
  },
];

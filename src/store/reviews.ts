import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type TokenReview,
  type ReviewStats,
  type ReviewSortOption,
  type RecommendationType,
  createReview,
  calculateReviewStats,
  sortReviews,
  MOCK_REVIEWS,
  REVIEW_XP_REWARDS,
} from '@/lib/reviews';
import { useLevelingStore } from './leveling';
import { useStakingStore } from './staking';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Reviews store integrates with leveling & staking:
 * - Writing reviews awards XP (50 base + bonuses)
 * - Receiving "helpful" votes gives ongoing XP
 * - Staking tier affects review weight in averages
 * - Level 3+ required to write reviews (anti-spam)
 *
 * Reviews are stored per-token for efficient lookup.
 * ─────────────────────────────────────────────────
 */

interface ReviewsState {
  // All reviews indexed by token ID
  reviewsByToken: Record<string, TokenReview[]>;

  // User's own reviews
  userReviews: TokenReview[];

  // Reviews the user has voted on
  votedReviewIds: string[];

  // Sort preference
  currentSort: ReviewSortOption;

  // Actions - Reviews
  addReview: (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    data: {
      rating: 1 | 2 | 3 | 4 | 5;
      title: string;
      content: string;
      pros?: string[];
      cons?: string[];
      recommendation: RecommendationType;
    },
    isVerifiedHolder: boolean
  ) => TokenReview | null;

  updateReview: (reviewId: string, updates: Partial<Pick<TokenReview, 'title' | 'content' | 'rating' | 'pros' | 'cons' | 'recommendation'>>) => void;
  deleteReview: (reviewId: string) => void;

  // Actions - Voting
  voteHelpful: (reviewId: string) => void;
  voteUnhelpful: (reviewId: string) => void;

  // Actions - Sorting
  setSort: (sort: ReviewSortOption) => void;

  // Getters
  getTokenReviews: (tokenId: string) => TokenReview[];
  getTokenStats: (tokenId: string) => ReviewStats;
  getSortedReviews: (tokenId: string) => TokenReview[];
  hasUserReviewed: (tokenId: string) => boolean;
  getUserReviewForToken: (tokenId: string) => TokenReview | undefined;
  canUserReview: () => boolean;
}

// Minimum level to write reviews
const MIN_REVIEW_LEVEL = 3;

// Current user mock data
const CURRENT_USER = {
  address: '0x1234...5678',
  username: 'CryptoKing',
};

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data grouped by token
      reviewsByToken: MOCK_REVIEWS.reduce((acc, review) => {
        if (!acc[review.tokenId]) acc[review.tokenId] = [];
        acc[review.tokenId].push(review);
        return acc;
      }, {} as Record<string, TokenReview[]>),

      userReviews: [],
      votedReviewIds: [],
      currentSort: 'most_helpful',

      // Add a new review
      addReview: (tokenId, tokenName, tokenSymbol, data, isVerifiedHolder) => {
        const state = get();
        const levelingStore = useLevelingStore.getState();
        const stakingStore = useStakingStore.getState();

        // Check if user can review
        if (levelingStore.level.level < MIN_REVIEW_LEVEL) {
          console.warn(`Must be level ${MIN_REVIEW_LEVEL}+ to write reviews`);
          return null;
        }

        // Check if user already reviewed this token
        if (state.hasUserReviewed(tokenId)) {
          console.warn('Already reviewed this token');
          return null;
        }

        const tierName = stakingStore.getCurrentTier();
        const review = createReview(
          tokenId,
          tokenName,
          tokenSymbol,
          {
            address: CURRENT_USER.address,
            username: CURRENT_USER.username,
            level: levelingStore.level.level,
            tier: tierName !== 'none' ? tierName.charAt(0).toUpperCase() + tierName.slice(1) : undefined,
          },
          data,
          isVerifiedHolder
        );

        // Update state
        const tokenReviews = state.reviewsByToken[tokenId] || [];
        set({
          reviewsByToken: {
            ...state.reviewsByToken,
            [tokenId]: [review, ...tokenReviews],
          },
          userReviews: [review, ...state.userReviews],
        });

        // Award XP
        let totalXP = REVIEW_XP_REWARDS.write_review;

        // First review bonus
        if (state.userReviews.length === 0) {
          totalXP += REVIEW_XP_REWARDS.first_review_bonus;
        }

        // Verified holder bonus
        if (isVerifiedHolder) {
          totalXP += REVIEW_XP_REWARDS.verified_holder_bonus;
        }

        const stakingMultiplier = stakingStore.getXPMultiplier();
        levelingStore.addXP(
          'review_submitted',
          { stakingMultiplier },
          `Wrote review for ${tokenSymbol}`
        );

        return review;
      },

      // Update an existing review
      updateReview: (reviewId, updates) => {
        set(state => {
          const newReviewsByToken = { ...state.reviewsByToken };
          const newUserReviews = [...state.userReviews];

          // Find and update in reviewsByToken
          Object.keys(newReviewsByToken).forEach(tokenId => {
            const index = newReviewsByToken[tokenId].findIndex(r => r.id === reviewId);
            if (index !== -1) {
              newReviewsByToken[tokenId] = [
                ...newReviewsByToken[tokenId].slice(0, index),
                { ...newReviewsByToken[tokenId][index], ...updates, updatedAt: new Date().toISOString() },
                ...newReviewsByToken[tokenId].slice(index + 1),
              ];
            }
          });

          // Update in userReviews
          const userIndex = newUserReviews.findIndex(r => r.id === reviewId);
          if (userIndex !== -1) {
            newUserReviews[userIndex] = {
              ...newUserReviews[userIndex],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }

          return { reviewsByToken: newReviewsByToken, userReviews: newUserReviews };
        });
      },

      // Delete a review
      deleteReview: (reviewId) => {
        set(state => {
          const newReviewsByToken = { ...state.reviewsByToken };

          Object.keys(newReviewsByToken).forEach(tokenId => {
            newReviewsByToken[tokenId] = newReviewsByToken[tokenId].filter(r => r.id !== reviewId);
          });

          return {
            reviewsByToken: newReviewsByToken,
            userReviews: state.userReviews.filter(r => r.id !== reviewId),
          };
        });
      },

      // Vote helpful
      voteHelpful: (reviewId) => {
        const state = get();
        if (state.votedReviewIds.includes(reviewId)) return;

        const levelingStore = useLevelingStore.getState();
        const stakingStore = useStakingStore.getState();

        set(state => {
          const newReviewsByToken = { ...state.reviewsByToken };
          let reviewAuthor: string | null = null;

          Object.keys(newReviewsByToken).forEach(tokenId => {
            const index = newReviewsByToken[tokenId].findIndex(r => r.id === reviewId);
            if (index !== -1) {
              const review = newReviewsByToken[tokenId][index];
              reviewAuthor = review.authorAddress;
              newReviewsByToken[tokenId] = [
                ...newReviewsByToken[tokenId].slice(0, index),
                {
                  ...review,
                  helpfulVotes: review.helpfulVotes + 1,
                  votedAddresses: [...review.votedAddresses, CURRENT_USER.address],
                },
                ...newReviewsByToken[tokenId].slice(index + 1),
              ];
            }
          });

          return {
            reviewsByToken: newReviewsByToken,
            votedReviewIds: [...state.votedReviewIds, reviewId],
          };
        });

        // Award XP to voter
        levelingStore.addXP(
          'review_vote',
          { stakingMultiplier: stakingStore.getXPMultiplier() },
          'Voted on review'
        );
      },

      // Vote unhelpful
      voteUnhelpful: (reviewId) => {
        const state = get();
        if (state.votedReviewIds.includes(reviewId)) return;

        set(state => {
          const newReviewsByToken = { ...state.reviewsByToken };

          Object.keys(newReviewsByToken).forEach(tokenId => {
            const index = newReviewsByToken[tokenId].findIndex(r => r.id === reviewId);
            if (index !== -1) {
              const review = newReviewsByToken[tokenId][index];
              newReviewsByToken[tokenId] = [
                ...newReviewsByToken[tokenId].slice(0, index),
                {
                  ...review,
                  unhelpfulVotes: review.unhelpfulVotes + 1,
                  votedAddresses: [...review.votedAddresses, CURRENT_USER.address],
                },
                ...newReviewsByToken[tokenId].slice(index + 1),
              ];
            }
          });

          return {
            reviewsByToken: newReviewsByToken,
            votedReviewIds: [...state.votedReviewIds, reviewId],
          };
        });
      },

      setSort: (sort) => set({ currentSort: sort }),

      // Getters
      getTokenReviews: (tokenId) => {
        return get().reviewsByToken[tokenId] || [];
      },

      getTokenStats: (tokenId) => {
        const reviews = get().reviewsByToken[tokenId] || [];
        return calculateReviewStats(reviews);
      },

      getSortedReviews: (tokenId) => {
        const state = get();
        const reviews = state.reviewsByToken[tokenId] || [];
        return sortReviews(reviews, state.currentSort);
      },

      hasUserReviewed: (tokenId) => {
        const reviews = get().reviewsByToken[tokenId] || [];
        return reviews.some(r => r.authorAddress === CURRENT_USER.address);
      },

      getUserReviewForToken: (tokenId) => {
        const reviews = get().reviewsByToken[tokenId] || [];
        return reviews.find(r => r.authorAddress === CURRENT_USER.address);
      },

      canUserReview: () => {
        const levelingStore = useLevelingStore.getState();
        return levelingStore.level.level >= MIN_REVIEW_LEVEL;
      },
    }),
    {
      name: 'vibecoin-reviews',
    }
  )
);

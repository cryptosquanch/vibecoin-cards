'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ReviewSortOption, RATING_CONFIG, RECOMMENDATION_CONFIG } from '@/lib/reviews';
import { useReviewsStore } from '@/store/reviews';
import { TokenReviewCard } from './TokenReviewCard';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Reviews list with sorting, stats, and rating breakdown:
 * - Distribution bar shows rating counts visually
 * - Recommendation summary (Buy/Hold/Avoid)
 * - Sort by newest, helpful, rating
 * - Empty state encourages first review
 *
 * Weighted average prioritizes verified + high-level users.
 * ─────────────────────────────────────────────────
 */

interface ReviewsListProps {
  tokenId: string;
  tokenName?: string;
  showStats?: boolean;
  className?: string;
}

export function ReviewsList({
  tokenId,
  tokenName,
  showStats = true,
  className = '',
}: ReviewsListProps) {
  const {
    getSortedReviews,
    getTokenStats,
    currentSort,
    setSort,
  } = useReviewsStore();

  const reviews = getSortedReviews(tokenId);
  const stats = getTokenStats(tokenId);

  const sortOptions: { id: ReviewSortOption; label: string }[] = [
    { id: 'most_helpful', label: 'Most Helpful' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'highest', label: 'Highest Rated' },
    { id: 'lowest', label: 'Lowest Rated' },
  ];

  // Calculate max rating count for distribution bars
  const maxRatingCount = useMemo(() => {
    return Math.max(...Object.values(stats.ratingDistribution), 1);
  }, [stats.ratingDistribution]);

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <span className="text-6xl mb-4 block">📝</span>
        <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-muted">
          Be the first to review {tokenName || 'this token'}!
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stats Header */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-botanical-50 rounded-xl p-6 mb-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-botanical-600 mb-1">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted">{stats.totalReviews} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="col-span-1 lg:col-span-2">
              <div className="space-y-1">
                {([5, 4, 3, 2, 1] as const).map((rating) => {
                  const count = stats.ratingDistribution[rating];
                  const percentage = (count / maxRatingCount) * 100;
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full bg-yellow-400 rounded-full"
                        />
                      </div>
                      <span className="w-6 text-muted text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <div className="space-y-1">
                {[
                  { type: 'buy' as const, count: stats.buyRecommendations },
                  { type: 'hold' as const, count: stats.holdRecommendations },
                  { type: 'avoid' as const, count: stats.avoidRecommendations },
                ].map(({ type, count }) => {
                  const config = RECOMMENDATION_CONFIG[type];
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={type} className="flex items-center gap-2 text-sm">
                      <span className={`${config.color} w-16`}>
                        {config.icon} {config.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className={`h-full rounded-full ${
                            type === 'buy' ? 'bg-green-400' :
                            type === 'hold' ? 'bg-blue-400' : 'bg-red-400'
                          }`}
                        />
                      </div>
                      <span className="text-muted text-xs">{Math.round(percentage)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
        <select
          value={currentSort}
          onChange={(e) => setSort(e.target.value as ReviewSortOption)}
          className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-botanical-500"
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <TokenReviewCard review={review} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Compact reviews summary for token cards
interface ReviewsSummaryProps {
  tokenId: string;
  showCount?: boolean;
  className?: string;
}

export function ReviewsSummary({ tokenId, showCount = true, className = '' }: ReviewsSummaryProps) {
  const { getTokenStats } = useReviewsStore();
  const stats = getTokenStats(tokenId);

  if (stats.totalReviews === 0) {
    return (
      <span className={`text-sm text-muted ${className}`}>
        No reviews yet
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
      {showCount && (
        <span className="text-sm text-muted">({stats.totalReviews})</span>
      )}
    </div>
  );
}

export default ReviewsList;

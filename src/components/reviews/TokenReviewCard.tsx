'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  type TokenReview,
  RATING_CONFIG,
  RECOMMENDATION_CONFIG,
} from '@/lib/reviews';
import { useReviewsStore } from '@/store/reviews';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Review cards display with verified badges and
 * weighted display based on author credibility:
 * - Verified holder badge (actually holds token)
 * - Level badge showing author's XP level
 * - Staking tier badge for premium users
 * - Helpful/unhelpful voting with XP rewards
 *
 * Visual hierarchy: recommendation > rating > content
 * ─────────────────────────────────────────────────
 */

interface TokenReviewCardProps {
  review: TokenReview;
  showToken?: boolean;
  compact?: boolean;
}

export function TokenReviewCard({ review, showToken = false, compact = false }: TokenReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { voteHelpful, voteUnhelpful, votedReviewIds } = useReviewsStore();

  const ratingConfig = RATING_CONFIG[review.rating];
  const recConfig = RECOMMENDATION_CONFIG[review.recommendation];
  const hasVoted = votedReviewIds.includes(review.id);
  const netHelpful = review.helpfulVotes - review.unhelpfulVotes;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-3 bg-white rounded-lg border hover:border-botanical-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Stars */}
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}>
                  ★
                </span>
              ))}
            </div>
            <span className={`text-xs font-medium ${recConfig.color}`}>
              {recConfig.icon} {recConfig.label}
            </span>
          </div>
          {review.verified && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              ✓ Verified
            </span>
          )}
        </div>
        <p className="text-sm font-medium line-clamp-1">{review.title}</p>
        <p className="text-xs text-muted mt-1">
          by {review.authorUsername} · {formatDate(review.createdAt)}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white rounded-xl border hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="w-10 h-10 bg-botanical-100 rounded-full flex items-center justify-center text-lg">
            {review.authorUsername.charAt(0)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{review.authorUsername}</span>
              <span className="text-xs bg-botanical-100 text-botanical-700 px-1.5 py-0.5 rounded">
                Lv.{review.authorLevel}
              </span>
              {review.authorTier && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                  {review.authorTier}
                </span>
              )}
              {review.verified && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  ✓ Verified Holder
                </span>
              )}
            </div>
            <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        {/* Token badge (optional) */}
        {showToken && (
          <div className="text-right">
            <p className="font-medium">{review.tokenSymbol}</p>
            <p className="text-xs text-muted">{review.tokenName}</p>
          </div>
        )}
      </div>

      {/* Rating & Recommendation */}
      <div className="flex items-center gap-4 mb-3">
        {/* Stars */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.span
                key={star}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: star * 0.05 }}
                className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
              >
                ★
              </motion.span>
            ))}
          </div>
          <span className={`text-sm font-medium ml-1 ${ratingConfig.color}`}>
            {ratingConfig.label}
          </span>
        </div>

        {/* Recommendation badge */}
        <motion.span
          whileHover={{ scale: 1.05 }}
          className={`px-3 py-1 rounded-full text-sm font-medium ${recConfig.bg} ${recConfig.color}`}
        >
          {recConfig.icon} {recConfig.label}
        </motion.span>
      </div>

      {/* Title & Content */}
      <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
      <p className={`text-muted ${expanded ? '' : 'line-clamp-3'}`}>
        {review.content}
      </p>
      {review.content.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-botanical-600 text-sm mt-1 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Pros & Cons */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">👍 Pros</p>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-1">
                    <span className="text-green-500">+</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">👎 Cons</p>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-1">
                    <span className="text-red-500">-</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer - Helpful votes */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <p className="text-sm text-muted">
          Was this review helpful?
        </p>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !hasVoted && voteHelpful(review.id)}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              hasVoted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            👍 {review.helpfulVotes}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !hasVoted && voteUnhelpful(review.id)}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              hasVoted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            👎 {review.unhelpfulVotes}
          </motion.button>
          {netHelpful > 5 && (
            <span className="text-xs text-green-600 font-medium">
              🏆 Top Review
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TokenReviewCard;

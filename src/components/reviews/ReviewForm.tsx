'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type RecommendationType, RECOMMENDATION_CONFIG } from '@/lib/reviews';
import { useReviewsStore } from '@/store/reviews';
import { useLevelingStore } from '@/store/leveling';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Review form uses progressive disclosure:
 * 1. Rating (required) - Stars select with hover preview
 * 2. Recommendation (required) - Buy/Hold/Avoid/Neutral
 * 3. Title & Content (required) - Main review text
 * 4. Pros/Cons (optional) - Expandable list inputs
 *
 * Form validates and shows XP reward preview before submit.
 * ─────────────────────────────────────────────────
 */

interface ReviewFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  isVerifiedHolder?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  tokenId,
  tokenName,
  tokenSymbol,
  isVerifiedHolder = false,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { addReview, canUserReview, hasUserReviewed, userReviews } = useReviewsStore();
  const levelingStore = useLevelingStore();
  const level = levelingStore.level.level;

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [showProsConsForm, setShowProsConsForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = canUserReview();
  const alreadyReviewed = hasUserReviewed(tokenId);
  const isFirstReview = userReviews.length === 0;

  // Calculate expected XP
  const baseXP = 50;
  const firstReviewBonus = isFirstReview ? 25 : 0;
  const verifiedBonus = isVerifiedHolder ? 15 : 0;
  const totalXP = baseXP + firstReviewBonus + verifiedBonus;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rating) {
      setError('Please select a rating');
      return;
    }
    if (!recommendation) {
      setError('Please select a recommendation');
      return;
    }
    if (!title.trim()) {
      setError('Please add a title');
      return;
    }
    if (content.length < 20) {
      setError('Review must be at least 20 characters');
      return;
    }

    const filteredPros = pros.filter(p => p.trim());
    const filteredCons = cons.filter(c => c.trim());

    const review = addReview(
      tokenId,
      tokenName,
      tokenSymbol,
      {
        rating,
        title: title.trim(),
        content: content.trim(),
        recommendation,
        pros: filteredPros.length > 0 ? filteredPros : undefined,
        cons: filteredCons.length > 0 ? filteredCons : undefined,
      },
      isVerifiedHolder
    );

    if (review) {
      onSuccess?.();
    }
  };

  const addProsCon = (type: 'pros' | 'cons') => {
    if (type === 'pros' && pros.length < 5) {
      setPros([...pros, '']);
    } else if (type === 'cons' && cons.length < 5) {
      setCons([...cons, '']);
    }
  };

  const updateProsCon = (type: 'pros' | 'cons', index: number, value: string) => {
    if (type === 'pros') {
      const newPros = [...pros];
      newPros[index] = value;
      setPros(newPros);
    } else {
      const newCons = [...cons];
      newCons[index] = value;
      setCons(newCons);
    }
  };

  const removeProsCon = (type: 'pros' | 'cons', index: number) => {
    if (type === 'pros') {
      setPros(pros.filter((_, i) => i !== index));
    } else {
      setCons(cons.filter((_, i) => i !== index));
    }
  };

  if (!canReview) {
    return (
      <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
        <span className="text-4xl mb-3 block">🔒</span>
        <h3 className="font-semibold text-yellow-800 mb-2">Level Up to Review</h3>
        <p className="text-sm text-yellow-700">
          You need to reach Level 3 to write reviews. Current level: {level}
        </p>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="p-6 bg-botanical-50 rounded-xl border border-botanical-200 text-center">
        <span className="text-4xl mb-3 block">✅</span>
        <h3 className="font-semibold text-botanical-800 mb-2">Already Reviewed</h3>
        <p className="text-sm text-botanical-700">
          You've already written a review for {tokenSymbol}. You can edit it from your profile.
        </p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Write a Review</h3>
          <p className="text-sm text-muted">Share your thoughts on {tokenName}</p>
        </div>
        <div className="text-right">
          <span className="text-botanical-600 font-medium">+{totalXP} XP</span>
          {isFirstReview && (
            <p className="text-xs text-botanical-500">First review bonus!</p>
          )}
        </div>
      </div>

      {/* Verified holder badge */}
      {isVerifiedHolder && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <span className="text-green-600">✓</span>
          <span className="text-sm text-green-700">
            Verified holder - your review will be marked as verified (+15 XP)
          </span>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
              className="text-3xl transition-colors"
            >
              <span className={(hoverRating ?? rating ?? 0) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                ★
              </span>
            </motion.button>
          ))}
          {(hoverRating || rating) && (
            <span className="ml-2 text-sm font-medium">
              {hoverRating || rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <label className="block text-sm font-medium mb-2">Recommendation</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(RECOMMENDATION_CONFIG) as [RecommendationType, typeof RECOMMENDATION_CONFIG['buy']][]).map(
            ([key, config]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setRecommendation(key)}
                className={`p-3 rounded-lg border-2 transition-colors text-center ${
                  recommendation === key
                    ? `${config.bg} ${config.color} border-current`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">{config.icon}</span>
                <span className="text-sm font-medium">{config.label}</span>
              </motion.button>
            )
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review in one line"
          maxLength={100}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-botanical-500 focus:border-transparent"
        />
        <p className="text-xs text-muted mt-1">{title.length}/100</p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium mb-2">Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this token..."
          rows={4}
          minLength={20}
          maxLength={1000}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-botanical-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-muted mt-1">
          {content.length}/1000 (min 20 characters)
        </p>
      </div>

      {/* Pros/Cons Toggle */}
      <button
        type="button"
        onClick={() => setShowProsConsForm(!showProsConsForm)}
        className="text-botanical-600 text-sm hover:underline"
      >
        {showProsConsForm ? '− Hide pros/cons' : '+ Add pros/cons (optional)'}
      </button>

      {/* Pros/Cons Form */}
      <AnimatePresence>
        {showProsConsForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4 overflow-hidden"
          >
            {/* Pros */}
            <div>
              <label className="block text-sm font-medium text-green-600 mb-2">
                👍 Pros
              </label>
              <div className="space-y-2">
                {pros.map((pro, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => updateProsCon('pros', i, e.target.value)}
                      placeholder="Add a pro..."
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                    />
                    {pros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProsCon('pros', i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {pros.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addProsCon('pros')}
                    className="text-sm text-green-600 hover:underline"
                  >
                    + Add another
                  </button>
                )}
              </div>
            </div>

            {/* Cons */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                👎 Cons
              </label>
              <div className="space-y-2">
                {cons.map((con, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={con}
                      onChange={(e) => updateProsCon('cons', i, e.target.value)}
                      placeholder="Add a con..."
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                    />
                    {cons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProsCon('cons', i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {cons.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addProsCon('cons')}
                    className="text-sm text-red-600 hover:underline"
                  >
                    + Add another
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-50 text-red-600 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 bg-botanical-500 text-white rounded-xl font-medium hover:bg-botanical-600 transition-colors"
        >
          Submit Review (+{totalXP} XP)
        </motion.button>
      </div>
    </motion.form>
  );
}

export default ReviewForm;

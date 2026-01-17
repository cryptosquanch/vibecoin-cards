'use client';

import { useWatchlistStore, notify } from '@/store';
import { motion } from 'framer-motion';

interface WatchlistButtonProps {
  tokenId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function WatchlistButton({
  tokenId,
  size = 'md',
  showText = false,
  className = '',
}: WatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlistStore();
  const isWatched = isInWatchlist(tokenId);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasWatched = isWatched;
    toggleWatchlist(tokenId);

    if (wasWatched) {
      notify.info('Removed from watchlist');
    } else {
      notify.success('Added to watchlist');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 transition-colors ${className}
        ${isWatched
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-400 hover:text-yellow-500'
        }`}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <motion.div
        className={sizeClasses[size]}
        whileTap={{ scale: 0.9 }}
        animate={isWatched ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        {isWatched ? (
          <svg
            className={iconSizes[size]}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ) : (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        )}
      </motion.div>
      {showText && (
        <span className="text-sm font-medium">
          {isWatched ? 'Watching' : 'Watch'}
        </span>
      )}
    </button>
  );
}

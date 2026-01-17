import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  watchlist: string[]; // Array of token IDs
  addToWatchlist: (tokenId: string) => void;
  removeFromWatchlist: (tokenId: string) => void;
  toggleWatchlist: (tokenId: string) => void;
  isInWatchlist: (tokenId: string) => boolean;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],

      addToWatchlist: (tokenId: string) => {
        set((state) => ({
          watchlist: state.watchlist.includes(tokenId)
            ? state.watchlist
            : [...state.watchlist, tokenId],
        }));
      },

      removeFromWatchlist: (tokenId: string) => {
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== tokenId),
        }));
      },

      toggleWatchlist: (tokenId: string) => {
        const { watchlist, addToWatchlist, removeFromWatchlist } = get();
        if (watchlist.includes(tokenId)) {
          removeFromWatchlist(tokenId);
        } else {
          addToWatchlist(tokenId);
        }
      },

      isInWatchlist: (tokenId: string) => {
        return get().watchlist.includes(tokenId);
      },

      clearWatchlist: () => {
        set({ watchlist: [] });
      },
    }),
    {
      name: 'vibecoin-watchlist', // localStorage key
    }
  )
);

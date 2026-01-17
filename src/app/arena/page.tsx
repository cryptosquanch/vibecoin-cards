'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Header } from '@/components/layout';
import { HandDisplay } from '@/components/hands';
import { BattleArenaDashboard, QuickBattleWidget } from '@/components/social';
import { MOCK_BATTLE_STATS } from '@/lib/battles';
import { MOCK_HOLDINGS, MOCK_TOKENS, type Token } from '@/lib/mock-data';

export default function ArenaPage() {
  const { authenticated, login } = usePrivy();

  // Get user's tokens for hand display
  const userTokens = useMemo(() => {
    return MOCK_HOLDINGS.map(h => MOCK_TOKENS.find(t => t.id === h.tokenId)!);
  }, []);

  if (!authenticated) {
    return (
      <div className="botanical-bg min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="surface-panel text-center py-16">
            <div className="w-24 h-24 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">⚔️</span>
            </div>
            <h1 className="heading-2 mb-4">Battle Arena</h1>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Connect your wallet to compete with your portfolio, climb the leaderboard, and earn bonus rewards.
            </p>
            <button onClick={login} className="btn btn-primary">
              Connect Wallet to Battle
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="heading-1 flex items-center gap-3">
              <span>⚔️</span>
              Battle Arena
            </h1>
            <p className="text-muted mt-1">
              Challenge other investors, climb the ranks, and prove you have the best portfolio
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/leaderboard" className="btn btn-secondary">
              📊 Full Leaderboard
            </Link>
            <button className="btn btn-primary">
              🎯 Quick Match
            </button>
          </div>
        </div>

        {/* Your Hand Preview */}
        <div className="surface-panel mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="heading-3 mb-4">Your Portfolio Hand</h2>
              <HandDisplay tokens={userTokens} showAllCards />
            </div>
            <div className="md:w-64 flex flex-col justify-center">
              <p className="text-sm text-muted mb-4">
                Your app portfolio forms your hand. Invest strategically in apps to build the strongest combination!
              </p>
              <Link href="/profile?tab=collection" className="btn btn-secondary text-center">
                Improve Your Portfolio
              </Link>
            </div>
          </div>
        </div>

        {/* Arena Dashboard */}
        <BattleArenaDashboard userAddress="0x1234...5678" />
      </main>
    </div>
  );
}

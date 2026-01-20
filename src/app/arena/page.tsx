'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Header } from '@/components/layout';
import { HandDisplay } from '@/components/hands';
import { BattleStatsCard } from '@/components/social';
import { TournamentBracket, ChallengesList, BattleHistoryList, BattleHistoryStats } from '@/components/battles';
import { LevelBadge } from '@/components/leveling';
import { useUserData, useBattles } from '@/hooks';
import { useBattlesStore, useLevelingStore, useStakingStore } from '@/store';
import { getBattleRank } from '@/lib/battles';
import type { BattleResult } from '@/hooks/useBattles';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * The arena page now integrates multiple systems:
 * 1. Battles Store - ELO, stats, matchmaking
 * 2. Leveling Store - XP rewards from battles
 * 3. Staking Store - XP multipliers
 *
 * Tabs organize: Battles, Challenges, Tournaments, History
 * ─────────────────────────────────────────────────
 */

type ArenaTab = 'battles' | 'challenges' | 'tournaments' | 'history';

export default function ArenaPage() {
  const { authenticated, login, user } = usePrivy();
  const { holdings, stats, loading: userLoading } = useUserData();
  const {
    battles,
    availableOpponents,
    isLoading: battleLoading,
    error: battleError,
    fetchBattles,
    findOpponents,
    quickMatch,
    startBattle,
  } = useBattles();

  // Zustand stores
  const battlesStore = useBattlesStore();
  const levelingStore = useLevelingStore();
  const stakingStore = useStakingStore();

  const [activeTab, setActiveTab] = useState<ArenaTab>('battles');
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [wagerAmount, setWagerAmount] = useState(0);

  // Get user's tokens for hand display
  const userTokens = useMemo(() => {
    return holdings.map(h => ({
      id: h.token.id,
      name: h.token.name,
      symbol: h.token.symbol,
      category: h.token.category as 'AI' | 'DeFi' | 'Gaming' | 'Creator',
      price: h.token.price,
      priceChange24h: h.token.priceChange24h,
      score: h.token.score,
      logo: h.token.logo,
      description: '',
      marketCap: 0,
      volume24h: 0,
      holders: 0,
      createdAt: h.token.createdAt,
      creator: '',
    }));
  }, [holdings]);

  // Fetch battles on mount
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      fetchBattles();
    }
  }, [authenticated, user?.wallet?.address, fetchBattles]);

  const handleQuickMatch = async () => {
    const result = await quickMatch(wagerAmount);
    if (result) {
      setBattleResult(result);
      // Award XP based on result
      const xpResult = result.result === 'CHALLENGER_WINS' ? 'win' :
                       result.result === 'OPPONENT_WINS' ? 'loss' : 'draw';
      battlesStore.completeBattle(
        `battle-${Date.now()}`,
        xpResult as 'win' | 'loss' | 'draw',
        1200 // Mock opponent ELO
      );
    }
  };

  const handleFindOpponents = async () => {
    await findOpponents();
    setShowMatchmaking(true);
  };

  const handleSelectOpponent = async (opponentId: string) => {
    const result = await startBattle(opponentId, wagerAmount);
    if (result) {
      setBattleResult(result);
      setShowMatchmaking(false);
      // Award XP
      const xpResult = result.result === 'CHALLENGER_WINS' ? 'win' :
                       result.result === 'OPPONENT_WINS' ? 'loss' : 'draw';
      battlesStore.completeBattle(
        result.battle.id,
        xpResult as 'win' | 'loss' | 'draw',
        1200
      );
    }
  };

  const closeBattleResult = () => {
    setBattleResult(null);
    fetchBattles();
  };

  // Challenge handlers
  const handleAcceptChallenge = (id: string) => {
    battlesStore.acceptChallenge(id);
  };

  const handleDeclineChallenge = (id: string) => {
    battlesStore.declineChallenge(id);
  };

  const handleCancelChallenge = (id: string) => {
    battlesStore.cancelChallenge(id);
  };

  // Tournament handlers
  const handleEnrollTournament = (id: string) => {
    const success = battlesStore.enrollInTournament(id);
    if (success) {
      // Enrolled successfully
    }
  };

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
              Connect your wallet to compete with your portfolio, climb the leaderboard, and earn XP rewards.
            </p>
            <button onClick={login} className="btn btn-primary">
              Connect Wallet to Battle
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { rank: battleRank, icon: rankIcon } = getBattleRank(battlesStore.stats.elo);

  return (
    <div className="botanical-bg min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="heading-1 flex items-center gap-3">
                <span>⚔️</span>
                Battle Arena
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted">
                  Rank: {rankIcon} {battleRank} ({battlesStore.stats.elo} ELO)
                </p>
                {battlesStore.stats.winStreak >= 3 && (
                  <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    🔥 {battlesStore.stats.winStreak} streak
                  </span>
                )}
              </div>
            </div>
            <LevelBadge size="md" />
          </div>
          <div className="flex gap-3">
            <Link href="/leaderboard?tab=gamification" className="btn btn-secondary">
              📊 Leaderboard
            </Link>
            <button
              onClick={handleQuickMatch}
              disabled={battleLoading || userTokens.length === 0}
              className="btn btn-primary"
            >
              {battleLoading ? '⏳ Matching...' : '🎯 Quick Match'}
            </button>
          </div>
        </div>

        {battleError && (
          <div className="surface-panel bg-red-50 border-red-200 text-red-700 mb-6">
            {battleError}
          </div>
        )}

        {/* XP Multiplier Banner */}
        {stakingStore.position && stakingStore.getXPMultiplier() > 1 && (
          <div className="bg-botanical-100 border border-botanical-300 rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
            <span>✨</span>
            <span className="text-sm">
              <strong>{stakingStore.getXPMultiplier()}x XP</strong> from {stakingStore.getCurrentTier()} staking tier
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'battles' as ArenaTab, label: '⚔️ Battles', count: undefined },
            { id: 'challenges' as ArenaTab, label: '📨 Challenges', count: battlesStore.pendingChallenges.filter(c => c.status === 'pending').length },
            { id: 'tournaments' as ArenaTab, label: '🏆 Tournaments', count: battlesStore.activeTournaments.length },
            { id: 'history' as ArenaTab, label: '📜 History', count: undefined },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-botanical-500 text-white'
                  : 'bg-botanical-100 hover:bg-botanical-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-botanical-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'battles' && (
          <div className="space-y-8">
            {/* Your Hand Preview */}
            <div className="surface-panel">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h2 className="heading-3 mb-4">Your Portfolio Hand</h2>
                  {userLoading ? (
                    <div className="text-muted">Loading your portfolio...</div>
                  ) : userTokens.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted mb-4">You need apps in your portfolio to battle!</p>
                      <Link href="/marketplace" className="btn btn-primary">
                        Browse Apps
                      </Link>
                    </div>
                  ) : (
                    <HandDisplay tokens={userTokens} showAllCards />
                  )}
                </div>
                <div className="md:w-64 flex flex-col justify-center">
                  <p className="text-sm text-muted mb-4">
                    Your app portfolio forms your hand. Invest strategically to build the strongest combination!
                  </p>
                  <Link href="/profile?tab=collection" className="btn btn-secondary text-center">
                    Improve Your Portfolio
                  </Link>
                </div>
              </div>
            </div>

            {/* Battle Stats & Options */}
            <div className="grid md:grid-cols-2 gap-6">
              <BattleStatsCard stats={battlesStore.stats} />

              <div className="surface-panel">
                <h3 className="heading-3 mb-4">Battle Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted mb-2 block">Wager Amount (optional)</label>
                    <div className="flex gap-2">
                      {[0, 10, 50, 100].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setWagerAmount(amount)}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            wagerAmount === amount
                              ? 'bg-botanical-500 text-white'
                              : 'bg-botanical-100 hover:bg-botanical-200'
                          }`}
                        >
                          {amount === 0 ? 'Free' : `${amount} pts`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleFindOpponents}
                      disabled={battleLoading || userTokens.length === 0}
                      className="btn btn-secondary flex-1"
                    >
                      🔍 Find Opponent
                    </button>
                    <button
                      onClick={handleQuickMatch}
                      disabled={battleLoading || userTokens.length === 0}
                      className="btn btn-primary flex-1"
                    >
                      ⚡ Quick Match
                    </button>
                  </div>

                  {/* XP Rewards Info */}
                  <div className="text-xs text-muted bg-botanical-50 rounded-lg p-3">
                    <p className="font-medium mb-1">XP Rewards:</p>
                    <div className="flex justify-between">
                      <span>🏆 Win: +30 XP</span>
                      <span>🤝 Draw: +15 XP</span>
                      <span>💔 Loss: +10 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Battles (from hook) */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Recent Battles</h3>
              {battles.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  No battles yet. Start your first match!
                </div>
              ) : (
                <div className="space-y-3">
                  {battles.slice(0, 5).map(battle => {
                    const isChallenger = battle.challenger.address === user?.wallet?.address;
                    const isWinner = battle.winnerId === (isChallenger ? battle.challengerId : battle.opponentId);
                    const isTie = !battle.winnerId;
                    const opponent = isChallenger ? battle.opponent : battle.challenger;
                    const myScore = isChallenger ? battle.challengerScore : battle.opponentScore;
                    const theirScore = isChallenger ? battle.opponentScore : battle.challengerScore;

                    return (
                      <div key={battle.id} className="flex items-center justify-between p-4 bg-botanical-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isTie ? 'bg-yellow-100' : isWinner ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className="text-xl">
                              {isTie ? '🤝' : isWinner ? '🏆' : '💔'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              vs {opponent.username || `${opponent.address.slice(0, 6)}...${opponent.address.slice(-4)}`}
                            </p>
                            <p className="text-sm text-muted">
                              {new Date(battle.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            isTie ? 'text-yellow-600' : isWinner ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {myScore} - {theirScore}
                          </p>
                          {battle.wagerAmount > 0 && (
                            <p className="text-xs text-muted">
                              {isWinner ? '+' : '-'}${battle.wagerAmount} wager
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="surface-panel">
            <h3 className="heading-3 mb-4">Challenges</h3>
            <ChallengesList
              incoming={battlesStore.pendingChallenges}
              outgoing={battlesStore.sentChallenges}
              onAccept={handleAcceptChallenge}
              onDecline={handleDeclineChallenge}
              onCancel={handleCancelChallenge}
            />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            {battlesStore.activeTournaments.length === 0 ? (
              <div className="surface-panel text-center py-12">
                <span className="text-5xl mb-4 block">🏆</span>
                <h3 className="heading-3 mb-2">No Active Tournaments</h3>
                <p className="text-muted">Check back soon for upcoming tournaments!</p>
              </div>
            ) : (
              battlesStore.activeTournaments.map(tournament => {
                const isEnrolled = battlesStore.enrolledTournamentIds.includes(tournament.id);
                const startDate = new Date(tournament.startTime);
                const isRegistrationOpen = tournament.status === 'registration';

                return (
                  <div key={tournament.id} className="surface-panel">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="heading-3 flex items-center gap-2">
                          🏆 {tournament.name}
                          {isEnrolled && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Enrolled
                            </span>
                          )}
                        </h3>
                        <p className="text-muted text-sm">{tournament.description}</p>
                      </div>
                      <div className="flex flex-col md:items-end gap-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span>💰 Prize: {tournament.prizePool} $VIBE</span>
                          <span>🎫 Entry: {tournament.entryFee} $VIBE</span>
                        </div>
                        <div className="text-sm text-muted">
                          {tournament.participants.length} / {tournament.maxParticipants} participants
                        </div>
                      </div>
                    </div>

                    {/* Registration status */}
                    {isRegistrationOpen && (
                      <div className="flex items-center justify-between bg-botanical-50 rounded-lg p-4 mb-4">
                        <div>
                          <p className="font-medium">Registration Open</p>
                          <p className="text-sm text-muted">
                            Starts: {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString()}
                          </p>
                        </div>
                        {!isEnrolled ? (
                          <button
                            onClick={() => handleEnrollTournament(tournament.id)}
                            disabled={tournament.participants.length >= tournament.maxParticipants}
                            className="btn btn-primary"
                          >
                            Enroll Now
                          </button>
                        ) : (
                          <button
                            onClick={() => battlesStore.withdrawFromTournament(tournament.id)}
                            className="btn btn-secondary"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tournament bracket */}
                    {tournament.status === 'in-progress' && (
                      <TournamentBracket
                        tournament={tournament}
                        currentUserAddress={user?.wallet?.address}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* History stats */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Battle Statistics</h3>
              <BattleHistoryStats entries={battlesStore.battleHistory} period="all" />
            </div>

            {/* Full history */}
            <div className="surface-panel">
              <h3 className="heading-3 mb-4">Battle History</h3>
              <BattleHistoryList
                entries={battlesStore.battleHistory}
                currentUserAddress={user?.wallet?.address}
                limit={20}
                showXP
              />
            </div>
          </div>
        )}
      </main>

      {/* Matchmaking Modal */}
      {showMatchmaking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="heading-3">Select Opponent</h3>
              <button onClick={() => setShowMatchmaking(false)} className="text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            {battleLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-botanical-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted">Finding opponents...</p>
              </div>
            ) : availableOpponents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">No opponents available right now</p>
                <button onClick={handleFindOpponents} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOpponents.map(opponent => (
                  <button
                    key={opponent.id}
                    onClick={() => handleSelectOpponent(opponent.id)}
                    className="w-full p-4 bg-botanical-50 hover:bg-botanical-100 rounded-xl text-left transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {opponent.username || `${opponent.address.slice(0, 6)}...${opponent.address.slice(-4)}`}
                        </p>
                        <p className="text-sm text-muted">
                          {opponent.battleWins}W / {opponent.battleLosses}L • {opponent.holdingsCount} apps
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">ELO: {opponent.elo}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battle Result Modal */}
      {battleResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-center">
            <div className="text-6xl mb-4">
              {battleResult.result === 'TIE' ? '🤝' :
               battleResult.result === 'CHALLENGER_WINS' ? '🏆' : '💔'}
            </div>
            <h2 className="heading-2 mb-2">
              {battleResult.result === 'TIE' ? "It's a Tie!" :
               battleResult.result === 'CHALLENGER_WINS' ? 'Victory!' : 'Defeat'}
            </h2>

            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <p className="text-sm text-muted mb-1">You</p>
                <p className="text-3xl font-bold">{battleResult.breakdown.challenger.finalScore}</p>
                <p className="text-xs text-muted">
                  Base: {battleResult.breakdown.challenger.baseScore} + Diversity: {battleResult.breakdown.challenger.diversityBonus}
                </p>
              </div>
              <div className="text-4xl self-center">vs</div>
              <div className="text-center">
                <p className="text-sm text-muted mb-1">Opponent</p>
                <p className="text-3xl font-bold">{battleResult.breakdown.opponent.finalScore}</p>
                <p className="text-xs text-muted">
                  Base: {battleResult.breakdown.opponent.baseScore} + Diversity: {battleResult.breakdown.opponent.diversityBonus}
                </p>
              </div>
            </div>

            {/* XP Earned */}
            <div className="bg-botanical-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted mb-1">Rewards</p>
              <p className="font-medium text-botanical-600">
                +{battleResult.result === 'CHALLENGER_WINS' ? '30' :
                  battleResult.result === 'TIE' ? '15' : '10'} XP
                {stakingStore.position && stakingStore.getXPMultiplier() > 1 && (
                  <span className="text-xs ml-1">
                    (×{stakingStore.getXPMultiplier()} staking bonus)
                  </span>
                )}
              </p>
            </div>

            {battleResult.battle.wagerAmount > 0 && (
              <p className={`text-lg font-medium mb-4 ${
                battleResult.result === 'CHALLENGER_WINS' ? 'text-green-600' : 'text-red-500'
              }`}>
                {battleResult.result === 'CHALLENGER_WINS' ? '+' : '-'}${battleResult.battle.wagerAmount}
              </p>
            )}

            <button onClick={closeBattleResult} className="btn btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

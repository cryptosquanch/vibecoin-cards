'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type Battle,
  type BattleStats,
  type Challenge,
  type Tournament,
  type BattleRank,
  getBattleRank,
  MOCK_BATTLE_STATS,
  MOCK_RECENT_BATTLES,
  MOCK_PENDING_CHALLENGES,
  MOCK_ACTIVE_TOURNAMENTS,
  MOCK_BATTLE_LEADERBOARD,
} from '@/lib/battles';
import {
  type LeaderboardType,
  type LeaderboardPeriod,
  type HandLeaderboardEntry,
  type PortfolioLeaderboardEntry,
  type CollectionLeaderboardEntry,
  type PerformanceLeaderboardEntry,
  LEADERBOARD_CONFIGS,
  MOCK_HAND_LEADERBOARD,
  MOCK_PORTFOLIO_LEADERBOARD,
  MOCK_COLLECTION_LEADERBOARD,
  MOCK_PERFORMANCE_LEADERBOARD,
  getRankChange,
  formatRank,
  getMedal,
} from '@/lib/leaderboards';

// ============================================
// Battle Stats Card
// ============================================

interface BattleStatsCardProps {
  stats: BattleStats;
}

export function BattleStatsCard({ stats }: BattleStatsCardProps) {
  const { rank, icon } = getBattleRank(stats.elo);

  const rankColors: Record<BattleRank, string> = {
    Bronze: 'text-amber-600',
    Silver: 'text-gray-400',
    Gold: 'text-yellow-500',
    Platinum: 'text-cyan-400',
    Diamond: 'text-blue-400',
    Master: 'text-purple-500',
    Grandmaster: 'text-red-500',
    Legend: 'text-yellow-400',
  };

  return (
    <div className="surface-panel">
      {/* Header with rank */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="heading-3">Battle Stats</h3>
          <p className="text-muted text-sm">{stats.totalBattles} total battles</p>
        </div>
        <div className="text-center">
          <span className="text-4xl">{icon}</span>
          <p className={`font-bold ${rankColors[rank]}`}>{rank}</p>
          <p className="text-sm text-muted">{stats.elo} ELO</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
          <p className="text-xs text-muted">Wins</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
          <p className="text-xs text-muted">Losses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.draws}</p>
          <p className="text-xs text-muted">Draws</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
          <p className="text-xs text-muted">Win Rate</p>
        </div>
      </div>

      {/* Streak & Wagers */}
      <div className="flex justify-between items-center text-sm border-t border-muted/20 pt-4">
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span>Current Streak: <strong>{stats.winStreak}</strong></span>
          <span className="text-muted">(Best: {stats.bestWinStreak})</span>
        </div>
        <div className="text-right">
          <span className="text-green-500">+{stats.totalWagersWon}</span>
          <span className="text-muted"> / </span>
          <span className="text-red-500">-{stats.totalWagersLost}</span>
          <span className="text-muted ml-1">pts</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Battle Card
// ============================================

interface BattleCardProps {
  battle: Battle;
  userAddress?: string;
}

export function BattleCard({ battle, userAddress = '0x1234...5678' }: BattleCardProps) {
  const isChallenger = battle.challenger.address === userAddress;
  const isWinner = battle.winner === userAddress;
  const opponent = isChallenger ? battle.opponent : battle.challenger;
  const player = isChallenger ? battle.challenger : battle.opponent;

  const resultColor = battle.status === 'completed'
    ? isWinner
      ? 'border-green-500'
      : battle.winner
        ? 'border-red-500'
        : 'border-gray-500'
    : 'border-muted/20';

  const typeLabels = {
    'hand-battle': '🃏 Hand Battle',
    'card-duel': '⚔️ Card Duel',
    'tournament': '🏆 Tournament',
  };

  return (
    <div className={`surface-card p-4 border-l-4 ${resultColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm">{typeLabels[battle.type]}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          battle.status === 'completed'
            ? isWinner ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {battle.status === 'completed'
            ? isWinner ? 'Victory' : 'Defeat'
            : battle.status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Player */}
        <div className="text-center">
          <div className="w-12 h-12 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">{player.username?.slice(0, 2) || '??'}</span>
          </div>
          <p className="text-sm font-medium">{player.username || 'You'}</p>
          {player.hand && (
            <p className="text-xs text-muted">{player.hand.name}</p>
          )}
        </div>

        {/* VS */}
        <div className="text-center px-4">
          <span className="text-2xl font-bold text-muted">VS</span>
          {battle.wager && (
            <p className="text-xs text-muted mt-1">
              {battle.wager.amount} pts
            </p>
          )}
        </div>

        {/* Opponent */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">{opponent.username?.slice(0, 2) || '??'}</span>
          </div>
          <p className="text-sm font-medium">{opponent.username || 'Opponent'}</p>
          {opponent.hand && (
            <p className="text-xs text-muted">{opponent.hand.name}</p>
          )}
        </div>
      </div>

      <div className="text-xs text-muted text-center mt-3">
        {new Date(battle.completedAt || battle.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

// ============================================
// Challenge Card
// ============================================

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export function ChallengeCard({ challenge, onAccept, onDecline }: ChallengeCardProps) {
  const timeLeft = new Date(challenge.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="surface-card p-4 border border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10"
    >
      <div className="flex items-start gap-4">
        {/* Challenger avatar */}
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">⚔️</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">
              <span className="text-yellow-600">Challenge</span> from {challenge.from.slice(0, 8)}...
            </p>
            <span className="text-xs text-muted">{hoursLeft}h left</span>
          </div>

          {challenge.message && (
            <p className="text-sm text-muted mb-3 italic">"{challenge.message}"</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted">Type:</span>{' '}
              <span className="font-medium">
                {challenge.battleType === 'hand-battle' ? '🃏 Hand Battle' : '⚔️ Card Duel'}
              </span>
              {challenge.wager && (
                <span className="ml-2 text-muted">
                  • Wager: <span className="text-yellow-600">{challenge.wager.amount} pts</span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onDecline?.(challenge.id)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                Decline
              </button>
              <button
                onClick={() => onAccept?.(challenge.id)}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Tournament Card
// ============================================

interface TournamentCardProps {
  tournament: Tournament;
  onJoin?: (id: string) => void;
}

export function TournamentCard({ tournament, onJoin }: TournamentCardProps) {
  const spotsLeft = tournament.maxParticipants - tournament.participants.length;
  const startDate = new Date(tournament.startTime);

  return (
    <div className="surface-panel">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-lg">{tournament.name}</h4>
          <p className="text-sm text-muted">{tournament.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          tournament.status === 'registration'
            ? 'bg-green-100 text-green-700'
            : tournament.status === 'in-progress'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
        }`}>
          {tournament.status === 'registration' ? 'Open' : tournament.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <p className="text-2xl font-bold text-yellow-500">{tournament.prizePool}</p>
          <p className="text-xs text-muted">Prize Pool</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{tournament.participants.length}/{tournament.maxParticipants}</p>
          <p className="text-xs text-muted">Players</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{tournament.entryFee}</p>
          <p className="text-xs text-muted">Entry Fee</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Starts {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {tournament.status === 'registration' && spotsLeft > 0 && (
          <button
            onClick={() => onJoin?.(tournament.id)}
            className="btn btn-primary"
          >
            Join ({spotsLeft} spots left)
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Leaderboard Display
// ============================================

interface LeaderboardDisplayProps {
  type: LeaderboardType;
  period?: LeaderboardPeriod;
  limit?: number;
}

export function LeaderboardDisplay({ type, period = 'all-time', limit = 10 }: LeaderboardDisplayProps) {
  const config = LEADERBOARD_CONFIGS[type];

  // Get appropriate mock data
  const getData = () => {
    switch (type) {
      case 'hands':
        return MOCK_HAND_LEADERBOARD.slice(0, limit);
      case 'portfolio':
        return MOCK_PORTFOLIO_LEADERBOARD.slice(0, limit);
      case 'collection':
        return MOCK_COLLECTION_LEADERBOARD.slice(0, limit);
      case 'battle':
        return MOCK_BATTLE_LEADERBOARD.slice(0, limit).map(e => ({
          ...e,
          value: e.elo,
        }));
      case 'performance':
        return MOCK_PERFORMANCE_LEADERBOARD.slice(0, limit);
      default:
        return [];
    }
  };

  const entries = getData();

  return (
    <div className="surface-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="heading-3">{config.title}</h3>
        </div>
        <span className="text-sm text-muted capitalize">{period.replace('-', ' ')}</span>
      </div>

      <p className="text-sm text-muted mb-4">{config.description}</p>

      <div className="space-y-2">
        {entries.map((entry) => {
          const medal = getMedal(entry.rank);
          const change = getRankChange(entry.rank, (entry as { previousRank?: number }).previousRank);

          return (
            <motion.div
              key={entry.address}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                (entry as { isCurrentUser?: boolean }).isCurrentUser
                  ? 'bg-botanical-100 dark:bg-botanical-900/20 ring-2 ring-botanical-500'
                  : 'hover:bg-muted/5'
              }`}
            >
              {/* Rank */}
              <div className="w-10 text-center">
                {medal ? (
                  <span className="text-2xl">{medal}</span>
                ) : (
                  <span className="text-lg font-bold text-muted">{entry.rank}</span>
                )}
              </div>

              {/* Rank change indicator */}
              <div className="w-6 text-center">
                {change.direction === 'up' && (
                  <span className="text-green-500 text-sm">↑{change.change}</span>
                )}
                {change.direction === 'down' && (
                  <span className="text-red-500 text-sm">↓{change.change}</span>
                )}
                {change.direction === 'same' && (
                  <span className="text-muted text-sm">–</span>
                )}
                {change.direction === 'new' && (
                  <span className="text-blue-500 text-xs">NEW</span>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.username || entry.address}
                  {(entry as { isCurrentUser?: boolean }).isCurrentUser && <span className="text-botanical-500 ml-1">(You)</span>}
                </p>
                {type === 'hands' && (
                  <p className="text-xs text-muted">
                    {(entry as HandLeaderboardEntry).handName}
                  </p>
                )}
                {type === 'performance' && (
                  <p className="text-xs text-muted">
                    {(entry as PerformanceLeaderboardEntry).tokenSymbol} • {(entry as PerformanceLeaderboardEntry).holdDays}d
                  </p>
                )}
              </div>

              {/* Value */}
              <div className="text-right">
                <p className="font-bold">{config.valueFormat(entry.value)}</p>
                {type === 'portfolio' && (
                  <p className={`text-xs ${(entry as PortfolioLeaderboardEntry).pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(entry as PortfolioLeaderboardEntry).pnlPercent >= 0 ? '+' : ''}
                    {(entry as PortfolioLeaderboardEntry).pnlPercent.toFixed(1)}%
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Leaderboard Tabs
// ============================================

interface LeaderboardTabsProps {
  onTypeChange?: (type: LeaderboardType) => void;
}

export function LeaderboardTabs({ onTypeChange }: LeaderboardTabsProps) {
  const [activeType, setActiveType] = useState<LeaderboardType>('hands');
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('all-time');

  const handleTypeChange = (type: LeaderboardType) => {
    setActiveType(type);
    onTypeChange?.(type);
  };

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(LEADERBOARD_CONFIGS) as LeaderboardType[]).map((type) => {
          const config = LEADERBOARD_CONFIGS[type];
          return (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeType === type
                  ? 'bg-botanical-500 text-white'
                  : 'bg-muted/10 hover:bg-muted/20'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.title}</span>
            </button>
          );
        })}
      </div>

      {/* Period tabs */}
      <div className="flex gap-2">
        {(['all-time', 'monthly', 'weekly', 'daily'] as LeaderboardPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`px-3 py-1 rounded text-sm capitalize ${
              activePeriod === period
                ? 'bg-botanical-100 text-botanical-700'
                : 'text-muted hover:bg-muted/10'
            }`}
          >
            {period.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <LeaderboardDisplay type={activeType} period={activePeriod} limit={10} />
    </div>
  );
}

// ============================================
// Battle Arena Dashboard
// ============================================

interface BattleArenaDashboardProps {
  userAddress?: string;
}

export function BattleArenaDashboard({ userAddress = '0x1234...5678' }: BattleArenaDashboardProps) {
  const [activeTab, setActiveTab] = useState<'battles' | 'tournaments' | 'leaderboard'>('battles');

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-muted/20 pb-2">
        {[
          { id: 'battles', label: 'My Battles', icon: '⚔️' },
          { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
          { id: 'leaderboard', label: 'Leaderboard', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-botanical-500 text-white'
                : 'hover:bg-muted/10'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'battles' && (
          <motion.div
            key="battles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats */}
            <BattleStatsCard stats={MOCK_BATTLE_STATS} />

            {/* Pending challenges */}
            {MOCK_PENDING_CHALLENGES.length > 0 && (
              <div>
                <h3 className="heading-3 mb-4">Incoming Challenges</h3>
                <div className="space-y-3">
                  {MOCK_PENDING_CHALLENGES.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onAccept={(id) => console.log('Accept', id)}
                      onDecline={(id) => console.log('Decline', id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent battles */}
            <div>
              <h3 className="heading-3 mb-4">Recent Battles</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {MOCK_RECENT_BATTLES.map((battle) => (
                  <BattleCard key={battle.id} battle={battle} userAddress={userAddress} />
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-4">
              <button className="btn btn-primary flex-1">
                🎯 Find Opponent
              </button>
              <button className="btn btn-secondary flex-1">
                📨 Challenge Friend
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'tournaments' && (
          <motion.div
            key="tournaments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <h3 className="heading-3">Active Tournaments</h3>
            {MOCK_ACTIVE_TOURNAMENTS.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onJoin={(id) => console.log('Join', id)}
              />
            ))}

            <div className="surface-panel text-center py-8">
              <p className="text-muted mb-4">More tournaments coming soon!</p>
              <button className="btn btn-secondary">
                🔔 Get Notified
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <LeaderboardTabs />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Quick Battle Widget (for profile/sidebar)
// ============================================

interface QuickBattleWidgetProps {
  stats: BattleStats;
  onViewArena?: () => void;
}

export function QuickBattleWidget({ stats, onViewArena }: QuickBattleWidgetProps) {
  const { rank, icon } = getBattleRank(stats.elo);

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Battle Stats</h4>
        <div className="flex items-center gap-1">
          <span>{icon}</span>
          <span className="text-sm font-bold">{rank}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
        <div>
          <p className="font-bold text-green-500">{stats.wins}</p>
          <p className="text-xs text-muted">W</p>
        </div>
        <div>
          <p className="font-bold text-red-500">{stats.losses}</p>
          <p className="text-xs text-muted">L</p>
        </div>
        <div>
          <p className="font-bold">{stats.winRate.toFixed(0)}%</p>
          <p className="text-xs text-muted">Rate</p>
        </div>
      </div>

      {stats.winStreak >= 3 && (
        <div className="text-center text-sm mb-3">
          <span className="text-orange-500">🔥 {stats.winStreak} Win Streak!</span>
        </div>
      )}

      <button
        onClick={onViewArena}
        className="btn btn-primary w-full text-sm"
      >
        ⚔️ Enter Arena
      </button>
    </div>
  );
}

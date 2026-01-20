'use client';

import type { Battle, BattleResult, BattleRewards } from '@/lib/battles';

interface BattleHistoryEntry {
  battle: Battle;
  result: BattleResult;
  rewards: BattleRewards;
  timestamp: string;
}

interface BattleHistoryListProps {
  entries: BattleHistoryEntry[];
  currentUserAddress?: string;
  limit?: number;
  showXP?: boolean;
}

const RESULT_CONFIG: Record<BattleResult, { icon: string; label: string; color: string; bg: string }> = {
  win: { icon: '🏆', label: 'Victory', color: 'text-green-600', bg: 'bg-green-100' },
  loss: { icon: '💔', label: 'Defeat', color: 'text-red-600', bg: 'bg-red-100' },
  draw: { icon: '🤝', label: 'Draw', color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

export function BattleHistoryList({
  entries,
  currentUserAddress = '0x1234...5678',
  limit = 10,
  showXP = true,
}: BattleHistoryListProps) {
  const displayEntries = entries.slice(0, limit);

  if (displayEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <span className="text-4xl mb-2 block">⚔️</span>
        <p>No battles yet</p>
        <p className="text-sm mt-1">Start your first match to build your history!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayEntries.map(({ battle, result, rewards, timestamp }) => {
        const config = RESULT_CONFIG[result];
        const isChallenger = battle.challenger.address === currentUserAddress;
        const opponent = isChallenger ? battle.opponent : battle.challenger;
        const opponentName = opponent.username || `${opponent.address.slice(0, 6)}...${opponent.address.slice(-4)}`;

        // Format time ago
        const timeAgo = getTimeAgo(new Date(timestamp));

        return (
          <div
            key={battle.id}
            className="flex items-center justify-between p-4 bg-botanical-50 rounded-xl hover:bg-botanical-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Result icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
                <span className="text-xl">{config.icon}</span>
              </div>

              {/* Battle info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-muted">vs</span>
                  <span className="font-medium">{opponentName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span>{getBattleTypeLabel(battle.type)}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="text-right">
              {/* ELO change */}
              <p className={`font-medium ${rewards.eloChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {rewards.eloChange >= 0 ? '+' : ''}{rewards.eloChange} ELO
              </p>

              {/* XP earned */}
              {showXP && rewards.pointsEarned > 0 && (
                <p className="text-sm text-botanical-600">
                  +{rewards.pointsEarned} XP
                  {rewards.streakBonus ? ` (🔥+${rewards.streakBonus})` : ''}
                </p>
              )}

              {/* Wager result */}
              {rewards.wagerWon && rewards.wagerWon !== 0 && (
                <p className={`text-xs ${rewards.wagerWon > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rewards.wagerWon > 0 ? '+' : ''}{rewards.wagerWon} points
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Battle history stats summary
interface BattleHistoryStatsProps {
  entries: BattleHistoryEntry[];
  period?: 'day' | 'week' | 'month' | 'all';
}

export function BattleHistoryStats({ entries, period = 'all' }: BattleHistoryStatsProps) {
  const filteredEntries = filterByPeriod(entries, period);

  const stats = filteredEntries.reduce(
    (acc, entry) => {
      acc.total++;
      if (entry.result === 'win') acc.wins++;
      if (entry.result === 'loss') acc.losses++;
      if (entry.result === 'draw') acc.draws++;
      acc.totalXP += entry.rewards.pointsEarned;
      acc.eloChange += entry.rewards.eloChange;
      return acc;
    },
    { total: 0, wins: 0, losses: 0, draws: 0, totalXP: 0, eloChange: 0 }
  );

  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-botanical-50 rounded-lg">
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-muted">Battles</p>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
        <p className="text-sm text-muted">Wins ({winRate}%)</p>
      </div>
      <div className="text-center p-3 bg-botanical-50 rounded-lg">
        <p className={`text-2xl font-bold ${stats.eloChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stats.eloChange >= 0 ? '+' : ''}{stats.eloChange}
        </p>
        <p className="text-sm text-muted">ELO Change</p>
      </div>
      <div className="text-center p-3 bg-botanical-50 rounded-lg">
        <p className="text-2xl font-bold text-botanical-600">+{stats.totalXP}</p>
        <p className="text-sm text-muted">XP Earned</p>
      </div>
    </div>
  );
}

// Helper functions
function getBattleTypeLabel(type: string): string {
  switch (type) {
    case 'hand-battle':
      return '🃏 Hand Battle';
    case 'card-duel':
      return '⚔️ Card Duel';
    case 'tournament':
      return '🏆 Tournament';
    default:
      return type;
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function filterByPeriod(entries: BattleHistoryEntry[], period: string): BattleHistoryEntry[] {
  const now = Date.now();
  const cutoffs: Record<string, number> = {
    day: now - 24 * 60 * 60 * 1000,
    week: now - 7 * 24 * 60 * 60 * 1000,
    month: now - 30 * 24 * 60 * 60 * 1000,
    all: 0,
  };

  const cutoff = cutoffs[period] || 0;
  return entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);
}

export default BattleHistoryList;

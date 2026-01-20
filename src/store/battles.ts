import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Battle,
  type BattleStats,
  type BattleResult,
  type BattleType,
  type BattleWager,
  type Challenge,
  type Tournament,
  type BattleRank,
  type BattleRewards,
  getBattleRank,
  calculateEloChange,
  calculateBattleRewards,
  createChallenge,
  MOCK_BATTLE_STATS,
  MOCK_RECENT_BATTLES,
  MOCK_PENDING_CHALLENGES,
  MOCK_ACTIVE_TOURNAMENTS,
} from '@/lib/battles';
import { useLevelingStore } from './leveling';
import { useStakingStore } from './staking';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * This store manages the entire battle system state:
 * 1. User's battle stats with ELO ranking
 * 2. Active/pending battles and challenges
 * 3. Matchmaking queue with ELO-based pairing
 * 4. Integration with XP/leveling for rewards
 *
 * The ELO system uses standard chess ratings (K=32)
 * to ensure fair matchmaking based on skill.
 * ─────────────────────────────────────────────────
 */

interface MatchmakingQueueEntry {
  address: string;
  elo: number;
  battleType: BattleType;
  wager?: BattleWager;
  joinedAt: string;
}

interface BattleHistoryEntry {
  battle: Battle;
  result: BattleResult;
  rewards: BattleRewards;
  timestamp: string;
}

interface BattlesState {
  // User stats
  stats: BattleStats;

  // Active state
  activeBattle: Battle | null;
  pendingChallenges: Challenge[];
  sentChallenges: Challenge[];
  battleHistory: BattleHistoryEntry[];

  // Tournaments
  activeTournaments: Tournament[];
  enrolledTournamentIds: string[];

  // Matchmaking
  isSearching: boolean;
  matchmakingQueue: MatchmakingQueueEntry[];
  searchStartedAt: string | null;

  // Actions - Battle Management
  startBattle: (opponent: string, type: BattleType, wager?: BattleWager) => Battle;
  completeBattle: (battleId: string, result: BattleResult, opponentElo: number) => BattleRewards;
  cancelBattle: (battleId: string) => void;

  // Actions - Challenges
  sendChallenge: (to: string, type: BattleType, wager?: BattleWager, message?: string) => Challenge;
  acceptChallenge: (challengeId: string) => Battle | null;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: (challengeId: string) => void;

  // Actions - Matchmaking
  joinMatchmaking: (type: BattleType, wager?: BattleWager) => void;
  leaveMatchmaking: () => void;
  findMatch: () => MatchmakingQueueEntry | null;

  // Actions - Tournaments
  enrollInTournament: (tournamentId: string) => boolean;
  withdrawFromTournament: (tournamentId: string) => void;

  // Actions - Stats
  updateStats: (result: BattleResult, eloChange: number) => void;
  resetStreak: () => void;

  // Getters
  getWinRate: () => number;
  getRankInfo: () => { rank: BattleRank; icon: string };
  getRecentBattles: (limit?: number) => BattleHistoryEntry[];
}

// ELO range for matchmaking (±200 by default)
const MATCHMAKING_ELO_RANGE = 200;

export const useBattlesStore = create<BattlesState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data
      stats: { ...MOCK_BATTLE_STATS },
      activeBattle: null,
      pendingChallenges: [...MOCK_PENDING_CHALLENGES],
      sentChallenges: [],
      battleHistory: MOCK_RECENT_BATTLES.map(battle => ({
        battle,
        result: battle.winner === '0x1234...5678' ? 'win' as BattleResult : 'loss' as BattleResult,
        rewards: { eloChange: 0, pointsEarned: 0 },
        timestamp: battle.completedAt || battle.createdAt,
      })),

      activeTournaments: [...MOCK_ACTIVE_TOURNAMENTS],
      enrolledTournamentIds: [],

      isSearching: false,
      matchmakingQueue: [],
      searchStartedAt: null,

      // Start a new battle
      startBattle: (opponent, type, wager) => {
        const state = get();
        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 min expiry

        const battle: Battle = {
          id: `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          status: 'in-progress',
          challenger: {
            address: '0x1234...5678', // Current user
            username: 'CryptoKing',
            isReady: true,
          },
          opponent: {
            address: opponent,
            isReady: true,
          },
          wager,
          createdAt: now.toISOString(),
          startedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        };

        set({ activeBattle: battle });
        return battle;
      },

      // Complete a battle and award XP
      completeBattle: (battleId, result, opponentElo) => {
        const state = get();
        const battle = state.activeBattle;

        if (!battle || battle.id !== battleId) {
          return { eloChange: 0, pointsEarned: 0 };
        }

        // Calculate rewards
        const rewards = calculateBattleRewards(
          result,
          battle,
          result === 'win' ? state.stats.winStreak + 1 : 0,
          opponentElo,
          state.stats.elo
        );

        // Update stats
        const newStats = { ...state.stats };
        newStats.totalBattles += 1;
        newStats.elo = Math.max(0, newStats.elo + rewards.eloChange);

        if (result === 'win') {
          newStats.wins += 1;
          newStats.winStreak += 1;
          newStats.bestWinStreak = Math.max(newStats.bestWinStreak, newStats.winStreak);
          if (rewards.wagerWon && rewards.wagerWon > 0) {
            newStats.totalWagersWon += rewards.wagerWon;
          }
        } else if (result === 'loss') {
          newStats.losses += 1;
          newStats.winStreak = 0;
          if (rewards.wagerWon && rewards.wagerWon < 0) {
            newStats.totalWagersLost += Math.abs(rewards.wagerWon);
          }
        } else {
          newStats.draws += 1;
        }

        newStats.winRate = newStats.totalBattles > 0
          ? Math.round((newStats.wins / newStats.totalBattles) * 1000) / 10
          : 0;

        // Update rank
        const { rank } = getBattleRank(newStats.elo);
        newStats.rank = rank;

        // Complete the battle
        const completedBattle: Battle = {
          ...battle,
          status: 'completed',
          winner: result === 'win' ? battle.challenger.address :
                  result === 'loss' ? battle.opponent.address : undefined,
          completedAt: new Date().toISOString(),
        };

        // Add to history
        const historyEntry: BattleHistoryEntry = {
          battle: completedBattle,
          result,
          rewards,
          timestamp: new Date().toISOString(),
        };

        set({
          stats: newStats,
          activeBattle: null,
          battleHistory: [historyEntry, ...state.battleHistory].slice(0, 50),
        });

        // Award XP through leveling store
        const levelingStore = useLevelingStore.getState();
        const stakingStore = useStakingStore.getState();
        const stakingMultiplier = stakingStore.getXPMultiplier();

        if (result === 'win') {
          levelingStore.addXP('battle_win', { stakingMultiplier }, `Battle victory (+${rewards.eloChange} ELO)`);
        } else if (result === 'loss') {
          levelingStore.addXP('battle_loss', { stakingMultiplier }, `Battle defeat (${rewards.eloChange} ELO)`);
        } else {
          levelingStore.addXP('battle_draw', { stakingMultiplier }, 'Battle draw');
        }

        return rewards;
      },

      cancelBattle: (battleId) => {
        const state = get();
        if (state.activeBattle?.id === battleId) {
          set({ activeBattle: null });
        }
      },

      // Challenge system
      sendChallenge: (to, type, wager, message) => {
        const state = get();
        const challenge = createChallenge('0x1234...5678', to, type, wager, message);

        set({
          sentChallenges: [challenge, ...state.sentChallenges],
        });

        return challenge;
      },

      acceptChallenge: (challengeId) => {
        const state = get();
        const challenge = state.pendingChallenges.find(c => c.id === challengeId);

        if (!challenge || challenge.status !== 'pending') {
          return null;
        }

        // Create battle from challenge
        const battle = get().startBattle(challenge.from, challenge.battleType, challenge.wager);

        // Update challenge status
        set({
          pendingChallenges: state.pendingChallenges.map(c =>
            c.id === challengeId ? { ...c, status: 'accepted' as const } : c
          ),
        });

        return battle;
      },

      declineChallenge: (challengeId) => {
        set(state => ({
          pendingChallenges: state.pendingChallenges.map(c =>
            c.id === challengeId ? { ...c, status: 'declined' as const } : c
          ),
        }));
      },

      cancelChallenge: (challengeId) => {
        set(state => ({
          sentChallenges: state.sentChallenges.filter(c => c.id !== challengeId),
        }));
      },

      // Matchmaking
      joinMatchmaking: (type, wager) => {
        const state = get();
        if (state.isSearching) return;

        const entry: MatchmakingQueueEntry = {
          address: '0x1234...5678',
          elo: state.stats.elo,
          battleType: type,
          wager,
          joinedAt: new Date().toISOString(),
        };

        set({
          isSearching: true,
          searchStartedAt: new Date().toISOString(),
          matchmakingQueue: [...state.matchmakingQueue, entry],
        });
      },

      leaveMatchmaking: () => {
        const state = get();
        set({
          isSearching: false,
          searchStartedAt: null,
          matchmakingQueue: state.matchmakingQueue.filter(
            e => e.address !== '0x1234...5678'
          ),
        });
      },

      findMatch: () => {
        const state = get();
        if (!state.isSearching) return null;

        const userElo = state.stats.elo;

        // Find opponent within ELO range
        const match = state.matchmakingQueue.find(
          entry =>
            entry.address !== '0x1234...5678' &&
            Math.abs(entry.elo - userElo) <= MATCHMAKING_ELO_RANGE
        );

        if (match) {
          // Remove both from queue
          set({
            isSearching: false,
            searchStartedAt: null,
            matchmakingQueue: state.matchmakingQueue.filter(
              e => e.address !== '0x1234...5678' && e.address !== match.address
            ),
          });
        }

        return match || null;
      },

      // Tournaments
      enrollInTournament: (tournamentId) => {
        const state = get();
        const tournament = state.activeTournaments.find(t => t.id === tournamentId);

        if (!tournament || tournament.status !== 'registration') {
          return false;
        }

        if (tournament.participants.length >= tournament.maxParticipants) {
          return false;
        }

        if (state.enrolledTournamentIds.includes(tournamentId)) {
          return false;
        }

        // Award XP for participation
        const levelingStore = useLevelingStore.getState();
        levelingStore.addXP('tournament_participation', {}, `Enrolled in ${tournament.name}`);

        set({
          enrolledTournamentIds: [...state.enrolledTournamentIds, tournamentId],
        });

        return true;
      },

      withdrawFromTournament: (tournamentId) => {
        set(state => ({
          enrolledTournamentIds: state.enrolledTournamentIds.filter(id => id !== tournamentId),
        }));
      },

      // Stats management
      updateStats: (result, eloChange) => {
        set(state => {
          const newStats = { ...state.stats };
          newStats.elo = Math.max(0, newStats.elo + eloChange);
          newStats.totalBattles += 1;

          if (result === 'win') {
            newStats.wins += 1;
            newStats.winStreak += 1;
            newStats.bestWinStreak = Math.max(newStats.bestWinStreak, newStats.winStreak);
          } else if (result === 'loss') {
            newStats.losses += 1;
            newStats.winStreak = 0;
          } else {
            newStats.draws += 1;
          }

          newStats.winRate = Math.round((newStats.wins / newStats.totalBattles) * 1000) / 10;
          const { rank } = getBattleRank(newStats.elo);
          newStats.rank = rank;

          return { stats: newStats };
        });
      },

      resetStreak: () => {
        set(state => ({
          stats: { ...state.stats, winStreak: 0 },
        }));
      },

      // Getters
      getWinRate: () => {
        const state = get();
        return state.stats.winRate;
      },

      getRankInfo: () => {
        const state = get();
        return getBattleRank(state.stats.elo);
      },

      getRecentBattles: (limit = 10) => {
        const state = get();
        return state.battleHistory.slice(0, limit);
      },
    }),
    {
      name: 'vibecoin-battles',
    }
  )
);

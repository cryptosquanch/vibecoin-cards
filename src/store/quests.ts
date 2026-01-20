import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type DailyQuestState,
  type WeeklyQuestState,
  type QuestAction,
  initializeDailyQuests,
  initializeWeeklyQuests,
  shouldResetDailyQuests,
  shouldResetWeeklyQuests,
  updateQuestProgress,
  claimQuestReward,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  ACTION_TO_QUEST_MAP,
} from '@/lib/quests';

interface QuestsState {
  // Quest states
  dailyQuests: DailyQuestState | null;
  weeklyQuests: WeeklyQuestState | null;

  // Streak tracking
  questStreak: number;
  lastCompletedDay: string | null;

  // Total stats
  totalXPFromQuests: number;
  totalQuestsCompleted: number;

  // Actions
  initializeQuests: () => void;
  trackAction: (action: QuestAction, value?: number) => void;
  claimReward: (questId: string, type: 'daily' | 'weekly') => number;
  resetIfNeeded: () => void;

  // Getters
  getDailyProgress: () => { completed: number; total: number; xpEarned: number };
  getWeeklyProgress: () => { completed: number; total: number; xpEarned: number };
}

export const useQuestsStore = create<QuestsState>()(
  persist(
    (set, get) => ({
      dailyQuests: null,
      weeklyQuests: null,
      questStreak: 0,
      lastCompletedDay: null,
      totalXPFromQuests: 0,
      totalQuestsCompleted: 0,

      initializeQuests: () => {
        const state = get();

        let dailyQuests = state.dailyQuests;
        let weeklyQuests = state.weeklyQuests;
        let questStreak = state.questStreak;
        let lastCompletedDay = state.lastCompletedDay;

        // Reset daily if needed
        if (shouldResetDailyQuests(dailyQuests)) {
          // Check if streak should continue
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          if (lastCompletedDay === yesterday) {
            // Streak continues
            questStreak += 1;
          } else if (lastCompletedDay !== today) {
            // Streak broken
            questStreak = 0;
          }

          dailyQuests = initializeDailyQuests();
        }

        // Reset weekly if needed
        if (shouldResetWeeklyQuests(weeklyQuests)) {
          weeklyQuests = initializeWeeklyQuests();
        }

        set({
          dailyQuests,
          weeklyQuests,
          questStreak,
          lastCompletedDay,
        });
      },

      trackAction: (action: QuestAction, value: number = 1) => {
        const state = get();

        // Ensure quests are initialized
        if (!state.dailyQuests || !state.weeklyQuests) {
          state.initializeQuests();
        }

        const questIds = ACTION_TO_QUEST_MAP[action] || [];

        let dailyQuests = state.dailyQuests;
        let weeklyQuests = state.weeklyQuests;

        for (const questId of questIds) {
          // Check daily quests
          const dailyDef = DAILY_QUESTS.find(q => q.id === questId);
          if (dailyDef && dailyQuests) {
            const currentProgress = dailyQuests.quests.find(q => q.questId === questId);
            if (currentProgress && !currentProgress.claimed) {
              const newValue = (currentProgress.currentValue || 0) + value;
              dailyQuests = {
                ...dailyQuests,
                quests: updateQuestProgress(
                  dailyQuests.quests,
                  questId,
                  newValue,
                  dailyDef.requirement.target
                ),
              };
            }
          }

          // Check weekly quests
          const weeklyDef = WEEKLY_QUESTS.find(q => q.id === questId);
          if (weeklyDef && weeklyQuests) {
            const currentProgress = weeklyQuests.quests.find(q => q.questId === questId);
            if (currentProgress && !currentProgress.claimed) {
              const newValue = (currentProgress.currentValue || 0) + value;
              weeklyQuests = {
                ...weeklyQuests,
                quests: updateQuestProgress(
                  weeklyQuests.quests,
                  questId,
                  newValue,
                  weeklyDef.requirement.target
                ),
              };
            }
          }
        }

        set({ dailyQuests, weeklyQuests });
      },

      claimReward: (questId: string, type: 'daily' | 'weekly') => {
        const state = get();

        if (type === 'daily' && state.dailyQuests) {
          const { quests, xpEarned } = claimQuestReward(state.dailyQuests.quests, questId);

          // Update streak tracking
          const today = new Date().toISOString().split('T')[0];

          set({
            dailyQuests: {
              ...state.dailyQuests,
              quests,
              totalXPEarned: state.dailyQuests.totalXPEarned + xpEarned,
            },
            totalXPFromQuests: state.totalXPFromQuests + xpEarned,
            totalQuestsCompleted: state.totalQuestsCompleted + 1,
            lastCompletedDay: today,
          });

          return xpEarned;
        }

        if (type === 'weekly' && state.weeklyQuests) {
          const { quests, xpEarned } = claimQuestReward(state.weeklyQuests.quests, questId);

          set({
            weeklyQuests: {
              ...state.weeklyQuests,
              quests,
              totalXPEarned: state.weeklyQuests.totalXPEarned + xpEarned,
            },
            totalXPFromQuests: state.totalXPFromQuests + xpEarned,
            totalQuestsCompleted: state.totalQuestsCompleted + 1,
          });

          return xpEarned;
        }

        return 0;
      },

      resetIfNeeded: () => {
        const state = get();

        let shouldUpdate = false;
        let dailyQuests = state.dailyQuests;
        let weeklyQuests = state.weeklyQuests;

        if (shouldResetDailyQuests(dailyQuests)) {
          dailyQuests = initializeDailyQuests();
          shouldUpdate = true;
        }

        if (shouldResetWeeklyQuests(weeklyQuests)) {
          weeklyQuests = initializeWeeklyQuests();
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          set({ dailyQuests, weeklyQuests });
        }
      },

      getDailyProgress: () => {
        const state = get();
        if (!state.dailyQuests) {
          return { completed: 0, total: DAILY_QUESTS.length, xpEarned: 0 };
        }

        const completed = state.dailyQuests.quests.filter(q => q.completed).length;
        return {
          completed,
          total: DAILY_QUESTS.length,
          xpEarned: state.dailyQuests.totalXPEarned,
        };
      },

      getWeeklyProgress: () => {
        const state = get();
        if (!state.weeklyQuests) {
          return { completed: 0, total: WEEKLY_QUESTS.length, xpEarned: 0 };
        }

        const completed = state.weeklyQuests.quests.filter(q => q.completed).length;
        return {
          completed,
          total: WEEKLY_QUESTS.length,
          xpEarned: state.weeklyQuests.totalXPEarned,
        };
      },
    }),
    {
      name: 'vibecoin-quests',
    }
  )
);

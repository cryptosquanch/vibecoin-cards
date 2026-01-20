'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestsStore } from '@/store';
import {
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  getQuestsWithProgress,
  getTimeUntilDailyReset,
  getTimeUntilWeeklyReset,
  formatTimeRemaining,
  getStreakBadge,
  type Quest,
} from '@/lib/quests';

interface QuestsPanelProps {
  className?: string;
}

export function QuestsPanel({ className = '' }: QuestsPanelProps) {
  const {
    dailyQuests,
    weeklyQuests,
    questStreak,
    initializeQuests,
    claimReward,
    getDailyProgress,
    getWeeklyProgress,
  } = useQuestsStore();

  // Initialize quests on mount
  useEffect(() => {
    initializeQuests();
  }, [initializeQuests]);

  const dailyProgress = getDailyProgress();
  const weeklyProgress = getWeeklyProgress();
  const dailyReset = getTimeUntilDailyReset();
  const weeklyReset = getTimeUntilWeeklyReset();
  const streakBadge = getStreakBadge(questStreak);

  // Get quests with progress merged
  const dailyQuestsWithProgress = dailyQuests
    ? getQuestsWithProgress(DAILY_QUESTS, dailyQuests.quests)
    : DAILY_QUESTS.map(q => ({ ...q, progress: 0, status: 'available' as const }));

  const weeklyQuestsWithProgress = weeklyQuests
    ? getQuestsWithProgress(WEEKLY_QUESTS, weeklyQuests.quests)
    : WEEKLY_QUESTS.map(q => ({ ...q, progress: 0, status: 'available' as const }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Streak */}
      <div className="flex items-center justify-between">
        <h2 className="heading-2">Quests</h2>
        {questStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full">
            <span className="text-lg">{streakBadge?.emoji || '🔥'}</span>
            <span className="text-sm font-medium text-orange-700">
              {questStreak} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Daily Quests */}
      <div className="surface-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="heading-3">Daily Quests</h3>
            <p className="text-sm text-muted">
              Resets in {formatTimeRemaining(dailyReset)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Progress</p>
            <p className="font-semibold">
              {dailyProgress.completed}/{dailyProgress.total}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-botanical-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-botanical-500"
            initial={{ width: 0 }}
            animate={{ width: `${(dailyProgress.completed / dailyProgress.total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {dailyQuestsWithProgress.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={() => claimReward(quest.id, 'daily')}
            />
          ))}
        </div>
      </div>

      {/* Weekly Quests */}
      <div className="surface-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="heading-3">Weekly Quests</h3>
            <p className="text-sm text-muted">
              Resets in {formatTimeRemaining(weeklyReset)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Progress</p>
            <p className="font-semibold">
              {weeklyProgress.completed}/{weeklyProgress.total}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-botanical-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(weeklyProgress.completed / weeklyProgress.total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {weeklyQuestsWithProgress.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={() => claimReward(quest.id, 'weekly')}
            />
          ))}
        </div>
      </div>

      {/* XP Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold text-botanical-600">{dailyProgress.xpEarned}</p>
          <p className="text-sm text-muted">Daily XP Earned</p>
        </div>
        <div className="surface-panel text-center">
          <p className="text-2xl font-bold text-purple-600">{weeklyProgress.xpEarned}</p>
          <p className="text-sm text-muted">Weekly XP Earned</p>
        </div>
      </div>
    </div>
  );
}

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
  const progressPercent = quest.requirement.target > 0
    ? Math.min(100, (quest.progress / quest.requirement.target) * 100)
    : 0;

  const isClaimable = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';

  return (
    <motion.div
      layout
      className={`p-4 rounded-xl border transition-colors ${
        isClaimed
          ? 'bg-green-50 border-green-200'
          : isClaimable
          ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
          : 'bg-botanical-50 border-botanical-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          isClaimed ? 'bg-green-100' : 'bg-white'
        }`}>
          {isClaimed ? '✅' : quest.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">{quest.name}</h4>
            <span className={`text-sm font-medium ${
              isClaimed ? 'text-green-600' : 'text-botanical-600'
            }`}>
              +{quest.xpReward} XP
            </span>
          </div>
          <p className="text-sm text-muted mb-2">{quest.description}</p>

          {/* Progress */}
          {!isClaimed && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-botanical-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${isClaimable ? 'bg-yellow-500' : 'bg-botanical-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted whitespace-nowrap">
                {quest.progress}/{quest.requirement.target}
              </span>
            </div>
          )}
        </div>

        {/* Claim Button */}
        {isClaimable && !isClaimed && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Claim
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default QuestsPanel;

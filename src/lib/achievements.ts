/**
 * Achievement System for Vibecoin
 *
 * Tracks and unlocks achievements based on user actions.
 * Achievements are stored in the database and checked after relevant actions.
 */

import prisma from './db';
import webhooks from './webhooks';

// Achievement requirement types
export type AchievementRequirementType =
  | 'trade_count'
  | 'hold_days'
  | 'portfolio_value'
  | 'category_count'
  | 'rank'
  | 'early_buy_hours'
  | 'battle_wins'
  | 'total_payouts'
  | 'token_count'
  | 'price_multiple'
  | 'consecutive_wins';

export interface AchievementRequirement {
  type: AchievementRequirementType;
  value: number | string;
}

export interface AchievementProgress {
  achievementId: string;
  achievementName: string;
  requirement: AchievementRequirement;
  currentValue: number | string;
  targetValue: number | string;
  progress: number; // 0-100 percentage
  unlocked: boolean;
  unlockedAt?: string;
}

// Check a single achievement requirement
async function checkRequirement(
  userId: string,
  requirement: AchievementRequirement
): Promise<{ met: boolean; currentValue: number | string }> {
  try {
    switch (requirement.type) {
      case 'trade_count': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { totalTrades: true },
        });
        const current = user?.totalTrades || 0;
        return { met: current >= (requirement.value as number), currentValue: current };
      }

      case 'portfolio_value': {
        const holdings = await prisma.holding.findMany({
          where: { userId },
          include: { token: { select: { price: true } } },
        });
        const total = holdings.reduce(
          (sum, h) => sum + Number(h.amount) * Number(h.token.price),
          0
        );
        return { met: total >= (requirement.value as number), currentValue: total };
      }

      case 'category_count': {
        const holdings = await prisma.holding.findMany({
          where: { userId },
          include: { token: { select: { category: true } } },
        });
        const categories = new Set(holdings.map(h => h.token.category));
        return {
          met: categories.size >= (requirement.value as number),
          currentValue: categories.size,
        };
      }

      case 'rank': {
        const holdings = await prisma.holding.findMany({
          where: { userId },
          include: { token: { select: { score: true } } },
        });
        const hasRank = holdings.some(h => {
          const score = h.token.score;
          if (requirement.value === 'A') return score >= 95;
          if (requirement.value === 'K') return score >= 90;
          if (requirement.value === 'Q') return score >= 85;
          if (requirement.value === 'J') return score >= 80;
          return false;
        });
        return { met: hasRank, currentValue: hasRank ? requirement.value : 'None' };
      }

      case 'battle_wins': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { battleWins: true },
        });
        const current = user?.battleWins || 0;
        return { met: current >= (requirement.value as number), currentValue: current };
      }

      case 'total_payouts': {
        const payouts = await prisma.payout.aggregate({
          where: { userId },
          _sum: { amount: true },
        });
        const total = Number(payouts._sum.amount || 0);
        return { met: total >= (requirement.value as number), currentValue: total };
      }

      case 'token_count': {
        const holdings = await prisma.holding.count({
          where: { userId, amount: { gt: 0 } },
        });
        return { met: holdings >= (requirement.value as number), currentValue: holdings };
      }

      case 'hold_days': {
        // Check if user has held any token for X days
        const oldestHolding = await prisma.holding.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (!oldestHolding) return { met: false, currentValue: 0 };

        const daysSinceFirst = Math.floor(
          (Date.now() - new Date(oldestHolding.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        return {
          met: daysSinceFirst >= (requirement.value as number),
          currentValue: daysSinceFirst,
        };
      }

      case 'early_buy_hours': {
        // This is checked at trade time, not retroactively
        // If this achievement exists and isn't unlocked, user hasn't qualified
        return { met: false, currentValue: 'N/A' };
      }

      case 'price_multiple': {
        // Check if any holding has achieved X multiple on initial investment
        const holdings = await prisma.holding.findMany({
          where: { userId },
          include: { token: { select: { price: true } } },
        });

        let maxMultiple = 0;
        for (const h of holdings) {
          const avgCost = Number(h.averageCost);
          if (avgCost > 0) {
            const multiple = Number(h.token.price) / avgCost;
            if (multiple > maxMultiple) maxMultiple = multiple;
          }
        }

        return {
          met: maxMultiple >= (requirement.value as number),
          currentValue: maxMultiple.toFixed(2),
        };
      }

      case 'consecutive_wins': {
        // Would need to track win streaks - placeholder for now
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { battleWins: true },
        });
        return { met: false, currentValue: 0 };
      }

      default:
        return { met: false, currentValue: 0 };
    }
  } catch (error) {
    console.error(`Error checking requirement ${requirement.type}:`, error);
    return { met: false, currentValue: 0 };
  }
}

// Check all achievements for a user
export async function checkAchievements(userId: string): Promise<string[]> {
  const unlockedIds: string[] = [];

  try {
    // Get user with their unlocked achievements
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          select: { achievementId: true },
        },
      },
    });

    if (!user) return [];

    const unlockedAchievementIds = new Set(
      user.achievements.map(a => a.achievementId)
    );

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Check each unearned achievement
    for (const achievement of allAchievements) {
      if (unlockedAchievementIds.has(achievement.id)) continue;

      try {
        const requirement = JSON.parse(achievement.requirement) as AchievementRequirement;
        const { met } = await checkRequirement(userId, requirement);

        if (met) {
          // Unlock achievement
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
            },
          });

          unlockedIds.push(achievement.id);

          // Dispatch webhook
          webhooks.achievementUnlocked({
            userId,
            userAddress: user.address,
            achievementId: achievement.id,
            achievementName: achievement.name,
            rarity: achievement.rarity as 'common' | 'rare' | 'epic' | 'legendary',
            unlockedAt: new Date().toISOString(),
          });

          console.log(`User ${userId} unlocked achievement: ${achievement.name}`);
        }
      } catch (error) {
        console.error(`Error checking achievement ${achievement.id}:`, error);
      }
    }

    return unlockedIds;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

// Get achievement progress for a user
export async function getAchievementProgress(
  userId: string
): Promise<AchievementProgress[]> {
  const progress: AchievementProgress[] = [];

  try {
    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
    });

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
    );

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    for (const achievement of allAchievements) {
      const requirement = JSON.parse(achievement.requirement) as AchievementRequirement;
      const unlocked = unlockedMap.has(achievement.id);
      const unlockedAt = unlockedMap.get(achievement.id);

      let currentValue: number | string = 0;
      let progressPercent = 0;

      if (!unlocked) {
        const result = await checkRequirement(userId, requirement);
        currentValue = result.currentValue;

        if (typeof requirement.value === 'number' && typeof currentValue === 'number') {
          progressPercent = Math.min(100, (currentValue / requirement.value) * 100);
        } else if (result.met) {
          progressPercent = 100;
        }
      } else {
        currentValue = requirement.value;
        progressPercent = 100;
      }

      progress.push({
        achievementId: achievement.id,
        achievementName: achievement.name,
        requirement,
        currentValue,
        targetValue: requirement.value,
        progress: Math.round(progressPercent),
        unlocked,
        unlockedAt: unlockedAt?.toISOString(),
      });
    }

    return progress;
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return [];
  }
}

// Check achievements after specific actions
export const achievementTriggers = {
  // Call after a trade
  afterTrade: async (userId: string, tokenCreatedAt: Date) => {
    // Check early bird achievement
    const hoursSinceCreation =
      (Date.now() - new Date(tokenCreatedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation <= 24) {
      // Check if early bird achievement exists and isn't unlocked
      try {
        const earlyBird = await prisma.achievement.findFirst({
          where: {
            requirement: {
              contains: 'early_buy_hours',
            },
          },
        });

        if (earlyBird) {
          const existing = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId,
                achievementId: earlyBird.id,
              },
            },
          });

          if (!existing) {
            await prisma.userAchievement.create({
              data: {
                userId,
                achievementId: earlyBird.id,
              },
            });

            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { address: true },
            });

            webhooks.achievementUnlocked({
              userId,
              userAddress: user?.address || '',
              achievementId: earlyBird.id,
              achievementName: earlyBird.name,
              rarity: earlyBird.rarity as 'common' | 'rare' | 'epic' | 'legendary',
              unlockedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error checking early bird achievement:', error);
      }
    }

    // Check other trade-related achievements
    return checkAchievements(userId);
  },

  // Call after a battle
  afterBattle: async (userId: string) => {
    return checkAchievements(userId);
  },

  // Call after receiving a payout
  afterPayout: async (userId: string) => {
    return checkAchievements(userId);
  },

  // Call periodically or when viewing profile
  checkAll: async (userId: string) => {
    return checkAchievements(userId);
  },
};

export default achievementTriggers;

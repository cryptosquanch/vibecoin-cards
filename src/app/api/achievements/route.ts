import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/achievements - List all achievements with unlock status for user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: [
        { rarity: 'asc' }, // common, rare, epic, legendary
        { name: 'asc' },
      ],
    });

    // If userId provided, include unlock status
    if (userId) {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlockedAt: true },
      });

      const achievementMap = new Map(
        userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
      );

      const achievementsWithStatus = achievements.map(a => ({
        ...a,
        unlocked: achievementMap.has(a.id),
        unlockedAt: achievementMap.get(a.id) || null,
      }));

      return NextResponse.json({
        achievements: achievementsWithStatus,
        stats: {
          total: achievements.length,
          unlocked: userAchievements.length,
          progress: Math.round((userAchievements.length / achievements.length) * 100),
        },
      });
    }

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Unlock an achievement for user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, achievementId } = body;

    if (!userId || !achievementId) {
      return NextResponse.json(
        { error: 'userId and achievementId are required' },
        { status: 400 }
      );
    }

    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Achievement already unlocked', unlockedAt: existing.unlockedAt },
        { status: 409 }
      );
    }

    // Verify user and achievement exist
    const [user, achievement] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.achievement.findUnique({ where: { id: achievementId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Unlock the achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
      include: {
        achievement: true,
      },
    });

    return NextResponse.json({
      message: `Achievement unlocked: ${achievement.name}`,
      userAchievement,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
    return NextResponse.json(
      { error: 'Failed to unlock achievement' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

// GET /api/me - Get current authenticated user's profile
export async function GET(request: Request) {
  // Verify authentication
  const { user: authUser, error: authError } = await verifyAuth(request);
  if (!authUser) {
    return unauthorizedResponse(authError || 'Authentication required');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        holdings: {
          include: {
            token: {
              select: {
                id: true,
                name: true,
                symbol: true,
                category: true,
                score: true,
                price: true,
                priceChange24h: true,
                logo: true,
              },
            },
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
        _count: {
          select: {
            trades: true,
            battlesAsChallenger: true,
            battlesAsOpponent: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate portfolio value
    const portfolioValue = user.holdings.reduce((total, holding) => {
      return total + (holding.amount * holding.token.price);
    }, 0);

    // Calculate unrealized P/L
    const unrealizedPL = user.holdings.reduce((total, holding) => {
      const currentValue = holding.amount * holding.token.price;
      const costBasis = holding.amount * holding.averageCost;
      return total + (currentValue - costBasis);
    }, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        address: user.address,
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        totalTrades: user.totalTrades,
        totalProfitLoss: user.totalProfitLoss,
        battleWins: user.battleWins,
        battleLosses: user.battleLosses,
        createdAt: user.createdAt,
        holdings: user.holdings,
        achievements: user.achievements,
        stats: {
          portfolioValue,
          unrealizedPL,
          totalBattles: user._count.battlesAsChallenger + user._count.battlesAsOpponent,
          winRate: user.battleWins + user.battleLosses > 0
            ? Math.round((user.battleWins / (user.battleWins + user.battleLosses)) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/me - Update current user's profile
export async function PATCH(request: Request) {
  // Verify authentication
  const { user: authUser, error: authError } = await verifyAuth(request);
  if (!authUser) {
    return unauthorizedResponse(authError || 'Authentication required');
  }

  try {
    const body = await request.json();
    const { username, avatar } = body;

    // Build update data (only include provided fields)
    const updateData: Record<string, string> = {};
    if (username !== undefined) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        address: true,
        username: true,
        avatar: true,
        balance: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

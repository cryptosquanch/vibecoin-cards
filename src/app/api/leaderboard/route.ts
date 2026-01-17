import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/leaderboard - Get user rankings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'portfolio'; // portfolio, profit, battles, trades
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Different leaderboard types
    switch (type) {
      case 'portfolio': {
        // Get users with their holdings and calculate portfolio value
        const users = await prisma.user.findMany({
          include: {
            holdings: {
              include: {
                token: {
                  select: { price: true },
                },
              },
            },
          },
        });

        // Calculate portfolio values and sort
        const rankedUsers = users
          .map(user => {
            const portfolioValue = user.holdings.reduce(
              (total, h) => total + h.amount * h.token.price,
              0
            );
            return {
              id: user.id,
              username: user.username,
              address: user.address,
              portfolioValue,
              holdingsCount: user.holdings.length,
              balance: user.balance,
            };
          })
          .sort((a, b) => b.portfolioValue - a.portfolioValue)
          .slice(offset, offset + limit);

        return NextResponse.json({
          leaderboard: rankedUsers,
          type: 'portfolio',
          pagination: {
            total: users.length,
            limit,
            offset,
            hasMore: offset + rankedUsers.length < users.length,
          },
        });
      }

      case 'profit': {
        // Rank by realized profit/loss
        const users = await prisma.user.findMany({
          orderBy: { totalProfitLoss: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            username: true,
            address: true,
            totalProfitLoss: true,
            totalTrades: true,
          },
        });

        const total = await prisma.user.count();

        return NextResponse.json({
          leaderboard: users,
          type: 'profit',
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + users.length < total,
          },
        });
      }

      case 'battles': {
        // Rank by battle win rate
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { battleWins: { gt: 0 } },
              { battleLosses: { gt: 0 } },
            ],
          },
          select: {
            id: true,
            username: true,
            address: true,
            battleWins: true,
            battleLosses: true,
          },
        });

        // Calculate win rate and sort
        const rankedUsers = users
          .map(user => {
            const totalBattles = user.battleWins + user.battleLosses;
            const winRate = totalBattles > 0 ? (user.battleWins / totalBattles) * 100 : 0;
            return {
              ...user,
              totalBattles,
              winRate: Math.round(winRate * 10) / 10,
            };
          })
          .sort((a, b) => {
            // Sort by win rate first, then by total battles
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.totalBattles - a.totalBattles;
          })
          .slice(offset, offset + limit);

        return NextResponse.json({
          leaderboard: rankedUsers,
          type: 'battles',
          pagination: {
            total: users.length,
            limit,
            offset,
            hasMore: offset + rankedUsers.length < users.length,
          },
        });
      }

      case 'trades': {
        // Rank by total trades
        const total = await prisma.user.count({
          where: { totalTrades: { gt: 0 } },
        });

        const users = await prisma.user.findMany({
          where: { totalTrades: { gt: 0 } },
          orderBy: { totalTrades: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            username: true,
            address: true,
            totalTrades: true,
            totalProfitLoss: true,
          },
        });

        return NextResponse.json({
          leaderboard: users,
          type: 'trades',
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + users.length < total,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid leaderboard type. Use: portfolio, profit, battles, or trades' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/payouts - Get payout history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId');
  const tokenId = searchParams.get('tokenId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build where clause
    const where: Record<string, string> = {};
    if (userId) where.userId = userId;
    if (tokenId) where.tokenId = tokenId;

    // Get total count
    const total = await prisma.payout.count({ where });

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        token: {
          select: {
            name: true,
            symbol: true,
            category: true,
          },
        },
        user: {
          select: {
            username: true,
            address: true,
          },
        },
      },
    });

    // Calculate totals if filtering by user
    let userTotals = null;
    if (userId) {
      const aggregate = await prisma.payout.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: true,
      });
      userTotals = {
        totalPayouts: aggregate._count,
        totalAmount: aggregate._sum.amount || 0,
      };
    }

    return NextResponse.json({
      payouts,
      userTotals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + payouts.length < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

// POST /api/payouts - Distribute revenue share to token holders (admin/system only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenId, totalAmount, source } = body;

    // TODO: Add admin/system authentication

    if (!tokenId || !totalAmount) {
      return NextResponse.json(
        { error: 'tokenId and totalAmount are required' },
        { status: 400 }
      );
    }

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'totalAmount must be positive' },
        { status: 400 }
      );
    }

    // Get token and all holders
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        holdings: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    if (token.holdings.length === 0) {
      return NextResponse.json(
        { error: 'No holders to distribute to' },
        { status: 400 }
      );
    }

    // Calculate total shares held
    const totalShares = token.holdings.reduce((sum, h) => sum + h.amount, 0);

    // Distribute proportionally to holders
    const result = await prisma.$transaction(async (tx) => {
      const payouts = [];

      for (const holding of token.holdings) {
        // Calculate pro-rata share
        const sharePercent = holding.amount / totalShares;
        const payoutAmount = totalAmount * sharePercent;

        // Create payout record
        const payout = await tx.payout.create({
          data: {
            userId: holding.userId,
            tokenId,
            amount: payoutAmount,
            sharePercent: sharePercent * 100,
            source: source || 'revenue_share',
          },
        });

        // Add to user balance
        await tx.user.update({
          where: { id: holding.userId },
          data: {
            balance: { increment: payoutAmount },
          },
        });

        payouts.push({
          userId: holding.userId,
          username: holding.user.username,
          amount: payoutAmount,
          sharePercent: sharePercent * 100,
        });
      }

      // Update token revenue pool
      await tx.token.update({
        where: { id: tokenId },
        data: {
          revenuePool: { increment: totalAmount },
        },
      });

      return payouts;
    });

    return NextResponse.json({
      message: `Distributed $${totalAmount.toFixed(2)} to ${result.length} holders`,
      distribution: result,
      token: {
        id: token.id,
        symbol: token.symbol,
        totalHolders: token.holdings.length,
        totalShares,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to distribute payouts:', error);
    return NextResponse.json(
      { error: 'Failed to distribute payouts' },
      { status: 500 }
    );
  }
}

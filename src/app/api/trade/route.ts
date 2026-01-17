import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, isOwner, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

// POST /api/trade - Execute a buy or sell trade (requires auth)
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse(authError || 'Authentication required');
    }

    const body = await request.json();
    const { tokenId, type, amount, txHash, signature } = body;

    // Use authenticated user's ID - don't allow trading on behalf of others
    const userId = authUser.id;

    // Optional: Validate blockchain proof exists
    if (!txHash) {
      console.warn('Trade submitted without blockchain transaction hash');
    }

    // Validate required fields
    if (!tokenId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, type, amount' },
        { status: 400 }
      );
    }

    // Validate trade type
    if (!['BUY', 'SELL'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid trade type. Must be BUY or SELL' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Get user and token
    const [user, token] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.token.findUnique({ where: { id: tokenId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Use current token price
    const price = token.price;
    const totalCost = amount * price;

    if (type === 'BUY') {
      // Check if user has enough balance
      if (user.balance < totalCost) {
        return NextResponse.json(
          { error: 'Insufficient balance', required: totalCost, available: user.balance },
          { status: 400 }
        );
      }

      // Execute buy trade in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct balance from user
        await tx.user.update({
          where: { id: userId },
          data: { balance: user.balance - totalCost },
        });

        // Create or update holding
        const existingHolding = await tx.holding.findUnique({
          where: {
            userId_tokenId: { userId, tokenId },
          },
        });

        if (existingHolding) {
          // Calculate new average cost
          const totalShares = existingHolding.amount + amount;
          const totalInvested = (existingHolding.amount * existingHolding.averageCost) + totalCost;
          const newAverageCost = totalInvested / totalShares;

          await tx.holding.update({
            where: { id: existingHolding.id },
            data: {
              amount: totalShares,
              averageCost: newAverageCost,
            },
          });
        } else {
          await tx.holding.create({
            data: {
              userId,
              tokenId,
              amount,
              averageCost: price,
            },
          });
        }

        // Update token metrics
        await tx.token.update({
          where: { id: tokenId },
          data: {
            volume24h: token.volume24h + totalCost,
            holders: existingHolding ? token.holders : token.holders + 1,
          },
        });

        // Record the trade with blockchain proof
        const trade = await tx.trade.create({
          data: {
            userId,
            tokenId,
            type: 'BUY',
            amount,
            price,
            total: totalCost,
            txHash: txHash || null,
          },
        });

        // Update user stats
        await tx.user.update({
          where: { id: userId },
          data: {
            totalTrades: user.totalTrades + 1,
          },
        });

        return trade;
      });

      return NextResponse.json({
        trade: result,
        message: `Successfully bought ${amount} ${token.symbol}`,
        newBalance: user.balance - totalCost,
      }, { status: 201 });

    } else {
      // SELL trade
      // Check if user has enough holdings
      const holding = await prisma.holding.findUnique({
        where: {
          userId_tokenId: { userId, tokenId },
        },
      });

      if (!holding || holding.amount < amount) {
        return NextResponse.json(
          { error: 'Insufficient holdings', required: amount, available: holding?.amount || 0 },
          { status: 400 }
        );
      }

      // Execute sell trade in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Add proceeds to user balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: user.balance + totalCost },
        });

        // Calculate profit/loss
        const costBasis = holding.averageCost * amount;
        const profitLoss = totalCost - costBasis;

        // Update or delete holding
        const remainingAmount = holding.amount - amount;
        if (remainingAmount <= 0) {
          await tx.holding.delete({
            where: { id: holding.id },
          });

          // Decrease holder count
          await tx.token.update({
            where: { id: tokenId },
            data: {
              volume24h: token.volume24h + totalCost,
              holders: Math.max(0, token.holders - 1),
            },
          });
        } else {
          await tx.holding.update({
            where: { id: holding.id },
            data: { amount: remainingAmount },
          });

          await tx.token.update({
            where: { id: tokenId },
            data: {
              volume24h: token.volume24h + totalCost,
            },
          });
        }

        // Record the trade with blockchain proof
        const trade = await tx.trade.create({
          data: {
            userId,
            tokenId,
            type: 'SELL',
            amount,
            price,
            total: totalCost,
            txHash: txHash || null,
          },
        });

        // Update user stats
        await tx.user.update({
          where: { id: userId },
          data: {
            totalTrades: user.totalTrades + 1,
            totalProfitLoss: user.totalProfitLoss + profitLoss,
          },
        });

        return { trade, profitLoss };
      });

      return NextResponse.json({
        trade: result.trade,
        profitLoss: result.profitLoss,
        message: `Successfully sold ${amount} ${token.symbol}`,
        newBalance: user.balance + totalCost,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to execute trade:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    );
  }
}

// GET /api/trade - Get trade history (public, with optional filters)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId');
  const tokenId = searchParams.get('tokenId');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build where clause
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (tokenId) where.tokenId = tokenId;
    if (type && ['BUY', 'SELL'].includes(type)) where.type = type;

    // Get total count
    const total = await prisma.trade.count({ where });

    // Get trades
    const trades = await prisma.trade.findMany({
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
            address: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + trades.length < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

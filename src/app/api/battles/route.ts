import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

// Calculate battle score from holdings
function calculatePortfolioScore(holdings: Array<{ amount: number; token: { score: number; price: number } }>) {
  if (holdings.length === 0) return 0;

  // Weighted average by position value
  let totalValue = 0;
  let weightedScore = 0;

  for (const holding of holdings) {
    const value = holding.amount * holding.token.price;
    totalValue += value;
    weightedScore += holding.token.score * value;
  }

  if (totalValue === 0) return 0;
  return Math.round(weightedScore / totalValue);
}

// Calculate category diversity bonus (1-4 categories = 0-15% bonus)
function calculateDiversityBonus(holdings: Array<{ token: { category: string } }>) {
  const categories = new Set(holdings.map(h => h.token.category));
  const bonusMap: Record<number, number> = { 1: 0, 2: 5, 3: 10, 4: 15 };
  return bonusMap[categories.size] || 0;
}

// POST /api/battles - Create a new battle challenge (requires auth)
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse(authError || 'Authentication required');
    }

    const body = await request.json();
    const { opponentId, wagerAmount } = body;

    // Use authenticated user as challenger
    const challengerId = authUser.id;

    // Validate required fields
    if (!opponentId) {
      return NextResponse.json(
        { error: 'opponentId is required' },
        { status: 400 }
      );
    }

    if (challengerId === opponentId) {
      return NextResponse.json(
        { error: 'Cannot battle yourself' },
        { status: 400 }
      );
    }

    // Get both users with holdings
    const [challenger, opponent] = await Promise.all([
      prisma.user.findUnique({
        where: { id: challengerId },
        include: {
          holdings: {
            include: {
              token: {
                select: { score: true, price: true, category: true },
              },
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: opponentId },
        include: {
          holdings: {
            include: {
              token: {
                select: { score: true, price: true, category: true },
              },
            },
          },
        },
      }),
    ]);

    if (!challenger) {
      return NextResponse.json(
        { error: 'Challenger not found' },
        { status: 404 }
      );
    }

    if (!opponent) {
      return NextResponse.json(
        { error: 'Opponent not found' },
        { status: 404 }
      );
    }

    // Check if challenger has enough balance for wager
    const wager = wagerAmount || 0;
    if (wager > 0 && challenger.balance < wager) {
      return NextResponse.json(
        { error: 'Insufficient balance for wager' },
        { status: 400 }
      );
    }

    // Calculate scores
    const challengerBaseScore = calculatePortfolioScore(challenger.holdings);
    const opponentBaseScore = calculatePortfolioScore(opponent.holdings);

    const challengerDiversityBonus = calculateDiversityBonus(challenger.holdings);
    const opponentDiversityBonus = calculateDiversityBonus(opponent.holdings);

    const challengerFinalScore = challengerBaseScore + challengerDiversityBonus;
    const opponentFinalScore = opponentBaseScore + opponentDiversityBonus;

    // Determine winner
    let winnerId: string | null = null;
    if (challengerFinalScore > opponentFinalScore) {
      winnerId = challengerId;
    } else if (opponentFinalScore > challengerFinalScore) {
      winnerId = opponentId;
    }
    // null winnerId means a tie

    // Create battle and handle wager in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create battle record
      const battle = await tx.battle.create({
        data: {
          challengerId,
          opponentId,
          challengerScore: challengerFinalScore,
          opponentScore: opponentFinalScore,
          winnerId,
          wagerAmount: wager,
          status: 'COMPLETED',
        },
        include: {
          challenger: {
            select: { id: true, username: true, address: true },
          },
          opponent: {
            select: { id: true, username: true, address: true },
          },
          winner: {
            select: { id: true, username: true, address: true },
          },
        },
      });

      // Handle wager transfer
      if (wager > 0 && winnerId) {
        const loserId = winnerId === challengerId ? opponentId : challengerId;

        // Deduct from loser
        await tx.user.update({
          where: { id: loserId },
          data: { balance: { decrement: wager } },
        });

        // Add to winner
        await tx.user.update({
          where: { id: winnerId },
          data: { balance: { increment: wager } },
        });
      }

      // Update battle stats
      if (winnerId) {
        const loserId = winnerId === challengerId ? opponentId : challengerId;

        await tx.user.update({
          where: { id: winnerId },
          data: { battleWins: { increment: 1 } },
        });

        await tx.user.update({
          where: { id: loserId },
          data: { battleLosses: { increment: 1 } },
        });
      }

      return battle;
    });

    return NextResponse.json({
      battle: result,
      breakdown: {
        challenger: {
          baseScore: challengerBaseScore,
          diversityBonus: challengerDiversityBonus,
          finalScore: challengerFinalScore,
          holdingsCount: challenger.holdings.length,
        },
        opponent: {
          baseScore: opponentBaseScore,
          diversityBonus: opponentDiversityBonus,
          finalScore: opponentFinalScore,
          holdingsCount: opponent.holdings.length,
        },
      },
      result: winnerId
        ? (winnerId === challengerId ? 'CHALLENGER_WINS' : 'OPPONENT_WINS')
        : 'TIE',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create battle:', error);
    return NextResponse.json(
      { error: 'Failed to create battle' },
      { status: 500 }
    );
  }
}

// GET /api/battles - Get battle history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) {
      where.OR = [
        { challengerId: userId },
        { opponentId: userId },
      ];
    }

    if (status && ['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.battle.count({ where });

    // Get battles
    const battles = await prisma.battle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        challenger: {
          select: { id: true, username: true, address: true },
        },
        opponent: {
          select: { id: true, username: true, address: true },
        },
        winner: {
          select: { id: true, username: true, address: true },
        },
      },
    });

    return NextResponse.json({
      battles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + battles.length < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    );
  }
}

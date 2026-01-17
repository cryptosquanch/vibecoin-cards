import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/user - Create or update user (called on wallet connect)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, username, avatar } = body;

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Upsert user (create if not exists, update if exists)
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: {
        username: username || undefined,
        avatar: avatar || undefined,
      },
      create: {
        address: address.toLowerCase(),
        username: username || `user_${address.slice(2, 8)}`,
        avatar,
        balance: 1000, // Starting balance for testing
      },
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
              },
            },
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Failed to create/update user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}

// GET /api/user - Get user by address or id
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const address = searchParams.get('address');
  const id = searchParams.get('id');

  if (!address && !id) {
    return NextResponse.json(
      { error: 'Either address or id is required' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: address
        ? { address: address.toLowerCase() }
        : { id: id! },
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
        ...user,
        portfolioValue,
        unrealizedPL,
        totalBattles: user._count.battlesAsChallenger + user._count.battlesAsOpponent,
      },
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

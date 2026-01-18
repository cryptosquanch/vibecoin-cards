import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MOCK_TOKENS } from '@/lib/mock-data';

// Helper to find mock token by ID or symbol
function findMockToken(id: string) {
  // Try by ID first
  let token = MOCK_TOKENS.find((t) => t.id === id);
  // Then by symbol
  if (!token) {
    token = MOCK_TOKENS.find((t) => t.symbol.toUpperCase() === id.toUpperCase());
  }
  return token;
}

// GET /api/tokens/[id] - Get single token by ID or symbol
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Try to find by ID first, then by symbol
    let token = await prisma.token.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
        _count: {
          select: {
            holdings: true,
            trades: true,
          },
        },
      },
    });

    // If not found by ID, try by symbol (exact match - SQLite doesn't support insensitive)
    if (!token) {
      token = await prisma.token.findUnique({
        where: { symbol: id.toUpperCase() },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
          _count: {
            select: {
              holdings: true,
              trades: true,
            },
          },
        },
      });
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Database unavailable, using mock data:', error);
    // Fallback to mock data when database is unavailable
    const mockToken = findMockToken(id);
    if (!mockToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ token: mockToken });
  }
}

// PATCH /api/tokens/[id] - Update token metrics (admin/system only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { score, price, priceChange24h, volume24h, holders, marketCap, revenuePool } = body;

    // TODO: Add admin authentication check

    const token = await prisma.token.findUnique({
      where: { id },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Build update data (only include fields that were provided)
    const updateData: Record<string, number> = {};
    if (score !== undefined) updateData.score = score;
    if (price !== undefined) updateData.price = price;
    if (priceChange24h !== undefined) updateData.priceChange24h = priceChange24h;
    if (volume24h !== undefined) updateData.volume24h = volume24h;
    if (holders !== undefined) updateData.holders = holders;
    if (marketCap !== undefined) updateData.marketCap = marketCap;
    if (revenuePool !== undefined) updateData.revenuePool = revenuePool;

    // Update token
    const updatedToken = await prisma.token.update({
      where: { id },
      data: updateData,
    });

    // If price was updated, record in price history
    if (price !== undefined) {
      await prisma.priceHistory.create({
        data: {
          tokenId: id,
          price,
          volume: volume24h || token.volume24h,
        },
      });
    }

    return NextResponse.json({ token: updatedToken });
  } catch (error) {
    console.error('Failed to update token:', error);
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    );
  }
}

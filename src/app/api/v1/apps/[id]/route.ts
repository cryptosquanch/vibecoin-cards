import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MOCK_TOKENS, generatePriceHistory } from '@/lib/mock-data';

// CORS headers
const ALLOWED_ORIGINS = [
  'https://0g-vibe.pages.dev',
  'https://vibecoin-cards.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-wallet-address, x-signature, x-timestamp',
  };
}

// Handle preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(origin) });
}

// GET /api/v1/apps/[id] - Get single app
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = request.headers.get('origin');

  try {
    // Try by ID first
    let token = await prisma.token.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    });

    // Try by symbol if not found
    if (!token) {
      token = await prisma.token.findUnique({
        where: { symbol: id.toUpperCase() },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });
    }

    if (!token) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404, headers: getCorsHeaders(origin) }
      );
    }

    const app = {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      category: token.category,
      description: token.description,
      logo: token.logo,
      appUrl: null,
      score: token.score,
      price: token.price,
      priceChange24h: token.priceChange24h,
      volume24h: token.volume24h,
      holders: token.holders,
      marketCap: token.marketCap,
      creatorAddress: token.creatorAddress,
      createdAt: token.createdAt,
      marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${token.id}`,
      priceHistory: token.priceHistory.map(ph => ({
        timestamp: ph.timestamp,
        price: ph.price,
        volume: ph.volume,
      })),
    };

    return NextResponse.json({ app }, { headers: getCorsHeaders(origin) });
  } catch (error) {
    console.error('Database unavailable, using mock data:', error);

    // Fallback to mock
    const mockToken = MOCK_TOKENS.find(t => t.id === id || t.symbol.toUpperCase() === id.toUpperCase());

    if (!mockToken) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404, headers: getCorsHeaders(origin) }
      );
    }

    const app = {
      ...mockToken,
      appUrl: null,
      creatorAddress: mockToken.creator,
      marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${mockToken.id}`,
      priceHistory: generatePriceHistory(mockToken.price, 30),
    };

    return NextResponse.json({ app }, { headers: getCorsHeaders(origin) });
  }
}

// PATCH /api/v1/apps/[id] - Update app metrics
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { metrics } = body;

    if (!metrics) {
      return NextResponse.json(
        { error: 'Missing metrics object' },
        { status: 400, headers: getCorsHeaders(origin) }
      );
    }

    try {
      const token = await prisma.token.findUnique({ where: { id } });

      if (!token) {
        return NextResponse.json(
          { error: 'App not found' },
          { status: 404, headers: getCorsHeaders(origin) }
        );
      }

      // Calculate new score based on metrics
      // Score formula: base 10 + (DAU weight) + (revenue weight)
      let newScore = token.score;
      if (metrics.dailyActiveUsers) {
        // +1 score per 100 DAU, max +30
        newScore += Math.min(Math.floor(metrics.dailyActiveUsers / 100), 30);
      }
      if (metrics.revenue) {
        // +1 score per $100 revenue, max +30
        newScore += Math.min(Math.floor(metrics.revenue / 100), 30);
      }
      newScore = Math.min(newScore, 100); // Cap at 100

      // Update token
      await prisma.token.update({
        where: { id },
        data: { score: newScore },
      });

      return NextResponse.json({
        success: true,
        newScore,
      }, { headers: getCorsHeaders(origin) });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: true,
        newScore: 50,
        _note: 'Demo mode - database unavailable',
      }, { headers: getCorsHeaders(origin) });
    }
  } catch (error) {
    console.error('Failed to update app:', error);
    return NextResponse.json(
      { error: 'Failed to update app' },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MOCK_TOKENS } from '@/lib/mock-data';

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Handle preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(origin) });
}

// GET /api/v1/creators/[address] - Get creator portfolio
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const origin = request.headers.get('origin');

  try {
    // Get all tokens created by this address
    const tokens = await prisma.token.findMany({
      where: { creatorAddress: address },
      orderBy: { score: 'desc' },
    });

    // Get total earnings from payouts
    const payouts = await prisma.payout.aggregate({
      where: { userId: address },
      _sum: { amount: true },
    });

    const creator = {
      address,
      appsCreated: tokens.length,
      totalEarnings: payouts._sum.amount || 0,
      apps: tokens.map(t => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        category: t.category,
        score: t.score,
        price: t.price,
        marketCap: t.marketCap,
        marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${t.id}`,
      })),
    };

    return NextResponse.json({ creator }, { headers: getCorsHeaders(origin) });
  } catch (error) {
    console.error('Database unavailable, using mock data:', error);

    // Fallback to mock
    const mockTokens = MOCK_TOKENS.filter(t =>
      t.creator.toLowerCase().includes(address.slice(-4).toLowerCase())
    );

    const creator = {
      address,
      appsCreated: mockTokens.length,
      totalEarnings: mockTokens.length * 1000, // Mock earnings
      apps: mockTokens.map(t => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        category: t.category,
        score: t.score,
        price: t.price,
        marketCap: t.marketCap,
        marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${t.id}`,
      })),
    };

    return NextResponse.json({ creator }, { headers: getCorsHeaders(origin) });
  }
}

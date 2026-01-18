import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MOCK_TOKENS } from '@/lib/mock-data';

// CORS headers for cross-origin requests
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-wallet-address, x-signature, x-timestamp',
  };
}

// Handle preflight requests
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(origin) });
}

// GET /api/v1/apps - List all apps/tokens
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const creator = searchParams.get('creator');
  const sortBy = searchParams.get('sortBy') || 'score';
  const order = searchParams.get('order') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build where clause
    const where: Record<string, unknown> = {};
    if (category && ['AI', 'DeFi', 'Gaming', 'Creator'].includes(category)) {
      where.category = category;
    }
    if (creator) {
      where.creatorAddress = creator;
    }

    // Build orderBy clause
    type TokenSortField = 'score' | 'price' | 'volume24h' | 'holders' | 'marketCap' | 'priceChange24h';
    const sortFieldMap: Record<string, TokenSortField> = {
      price: 'price',
      volume: 'volume24h',
      holders: 'holders',
      marketCap: 'marketCap',
      priceChange: 'priceChange24h',
      score: 'score',
    };
    const sortField = sortFieldMap[sortBy] || 'score';
    const orderBy = { [sortField]: order === 'asc' ? 'asc' as const : 'desc' as const };

    // Get total count
    const total = await prisma.token.count({ where });

    // Get tokens
    const tokens = await prisma.token.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });

    // Map to app format
    const apps = tokens.map(token => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      category: token.category,
      description: token.description,
      logo: token.logo,
      appUrl: null, // Can be added to schema later
      score: token.score,
      price: token.price,
      priceChange24h: token.priceChange24h,
      volume24h: token.volume24h,
      holders: token.holders,
      marketCap: token.marketCap,
      creatorAddress: token.creatorAddress,
      createdAt: token.createdAt,
      marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${token.id}`,
    }));

    return NextResponse.json({
      apps,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tokens.length < total,
      },
    }, { headers: getCorsHeaders(origin) });
  } catch (error) {
    console.error('Database unavailable, using mock data:', error);

    // Fallback to mock data
    let apps = [...MOCK_TOKENS];

    if (category) {
      apps = apps.filter(t => t.category === category);
    }
    if (creator) {
      apps = apps.filter(t => t.creator === creator);
    }

    // Sort
    const sortFieldMap: Record<string, keyof typeof MOCK_TOKENS[0]> = {
      price: 'price',
      volume: 'volume24h',
      holders: 'holders',
      marketCap: 'marketCap',
      priceChange: 'priceChange24h',
      score: 'score',
    };
    const sortField = sortFieldMap[sortBy] || 'score';
    apps.sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const total = apps.length;
    const paginatedApps = apps.slice(offset, offset + limit).map(token => ({
      ...token,
      appUrl: null,
      creatorAddress: token.creator,
      marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${token.id}`,
    }));

    return NextResponse.json({
      apps: paginatedApps,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + paginatedApps.length < total,
      },
    }, { headers: getCorsHeaders(origin) });
  }
}

// POST /api/v1/apps - Register a new app/token
export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { name, symbol, category, description, logo, appUrl, creatorAddress } = body;

    // Validate required fields
    if (!name || !symbol || !category || !description || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, category, description, creatorAddress' },
        { status: 400, headers: getCorsHeaders(origin) }
      );
    }

    // Validate category
    if (!['AI', 'DeFi', 'Gaming', 'Creator'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: AI, DeFi, Gaming, or Creator' },
        { status: 400, headers: getCorsHeaders(origin) }
      );
    }

    // Validate symbol format
    const symbolUpper = symbol.toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(symbolUpper)) {
      return NextResponse.json(
        { error: 'Symbol must be 2-5 uppercase letters' },
        { status: 400, headers: getCorsHeaders(origin) }
      );
    }

    try {
      // Check if symbol already exists
      const existing = await prisma.token.findUnique({
        where: { symbol: symbolUpper },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Token symbol already exists' },
          { status: 409, headers: getCorsHeaders(origin) }
        );
      }

      // Create token
      const token = await prisma.token.create({
        data: {
          name,
          symbol: symbolUpper,
          category,
          description,
          logo: logo || null,
          creatorAddress,
          score: 10,
          price: 0.01,
          priceChange24h: 0,
          volume24h: 0,
          holders: 1,
          marketCap: 10000,
        },
      });

      return NextResponse.json({
        success: true,
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          category: token.category,
          description: token.description,
          logo: token.logo,
          appUrl: appUrl || null,
          score: token.score,
          price: token.price,
          marketCap: token.marketCap,
          createdAt: token.createdAt,
          marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${token.id}`,
        },
      }, { status: 201, headers: getCorsHeaders(origin) });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Mock response for demo when DB is unavailable
      const mockId = `mock-${Date.now()}`;
      return NextResponse.json({
        success: true,
        token: {
          id: mockId,
          name,
          symbol: symbolUpper,
          category,
          description,
          logo: logo || null,
          appUrl: appUrl || null,
          score: 10,
          price: 0.01,
          marketCap: 10000,
          createdAt: new Date().toISOString(),
          marketplaceUrl: `https://vibecoin-cards.vercel.app/marketplace/${mockId}`,
        },
        _note: 'Created in demo mode - database unavailable',
      }, { status: 201, headers: getCorsHeaders(origin) });
    }
  } catch (error) {
    console.error('Failed to create app:', error);
    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

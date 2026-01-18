import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MOCK_TOKENS } from '@/lib/mock-data';

// Helper to get mock tokens with filtering and sorting
function getMockTokens(category: string | null, sortBy: string, order: string, limit: number, offset: number) {
  let tokens = [...MOCK_TOKENS];

  // Filter by category
  if (category && ['AI', 'DeFi', 'Gaming', 'Creator'].includes(category)) {
    tokens = tokens.filter((t) => t.category === category);
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
  tokens.sort((a, b) => {
    const aVal = a[sortField] as number;
    const bVal = b[sortField] as number;
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Paginate
  const total = tokens.length;
  const paginatedTokens = tokens.slice(offset, offset + limit);

  return {
    tokens: paginatedTokens,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + paginatedTokens.length < total,
    },
  };
}

// GET /api/tokens - List all tokens with optional filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const sortBy = searchParams.get('sortBy') || 'score';
  const order = searchParams.get('order') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build where clause
    const where = category && ['AI', 'DeFi', 'Gaming', 'Creator'].includes(category)
      ? { category }
      : {};

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

    // Get tokens with pagination
    const tokens = await prisma.token.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        symbol: true,
        category: true,
        description: true,
        logo: true,
        score: true,
        price: true,
        priceChange24h: true,
        volume24h: true,
        holders: true,
        marketCap: true,
        totalSupply: true,
        revenuePool: true,
        creatorAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      tokens,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tokens.length < total,
      },
    });
  } catch (error) {
    console.error('Database unavailable, using mock data:', error);
    // Fallback to mock data when database is unavailable
    return NextResponse.json(getMockTokens(category, sortBy, order, limit, offset));
  }
}

// POST /api/tokens - Create a new token (admin/creator only)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Add authentication check for admin/creator

    const { name, symbol, category, description, logo, creatorAddress } = body;

    // Validate required fields
    if (!name || !symbol || !category || !description || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if symbol already exists
    const existing = await prisma.token.findUnique({
      where: { symbol },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Token symbol already exists' },
        { status: 409 }
      );
    }

    // Create token
    const token = await prisma.token.create({
      data: {
        name,
        symbol,
        category,
        description,
        logo,
        creatorAddress,
        score: 10, // Start with low score
        price: 0.01, // Initial price
      },
    });

    return NextResponse.json({ token }, { status: 201 });
  } catch (error) {
    console.error('Failed to create token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

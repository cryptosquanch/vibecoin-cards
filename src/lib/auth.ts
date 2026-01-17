import { PrivyClient } from '@privy-io/node';
import { NextResponse } from 'next/server';
import prisma from './db';

// Initialize Privy client
const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export interface AuthUser {
  id: string;
  privyId: string;
  address: string;
  username: string | null;
}

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

/**
 * Verify Privy access token and get/create user
 * Returns the authenticated user or null if not authenticated
 */
export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Verify the token with Privy using the client's built-in verification
    const verifiedClaims = await privy.utils().auth().verifyAccessToken(accessToken);

    if (!verifiedClaims || !verifiedClaims.user_id) {
      return { user: null, error: 'Invalid access token' };
    }

    // Define Privy user type for type safety
    type PrivyUserType = {
      wallet?: { address: string };
      linked_accounts?: Array<{ type: string; address?: string }>;
    };

    // Get user from Privy by their user ID
    // Use type assertion to access the underlying Users class methods
    const privyUser = await (privy as unknown as { users: { _get: (id: string) => Promise<PrivyUserType | null> } }).users._get(verifiedClaims.user_id);

    if (!privyUser) {
      return { user: null, error: 'User not found in Privy' };
    }

    // Get wallet address from Privy user
    const walletAddress = privyUser.wallet?.address ||
      privyUser.linked_accounts?.find((a) => a.type === 'wallet')?.address;

    if (!walletAddress) {
      return { user: null, error: 'No wallet address found for user' };
    }

    // Get or create user in our database
    const user = await prisma.user.upsert({
      where: { address: walletAddress.toLowerCase() },
      update: {}, // Don't update on login, just find
      create: {
        address: walletAddress.toLowerCase(),
        username: `user_${walletAddress.slice(2, 8)}`,
        balance: 1000, // Starting balance for new users
      },
      select: {
        id: true,
        address: true,
        username: true,
      },
    });

    return {
      user: {
        id: user.id,
        privyId: verifiedClaims.user_id,
        address: user.address,
        username: user.username,
      },
      error: null,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Higher-order function to protect API routes
 * Wraps a handler and ensures the user is authenticated
 */
export function withAuth<T extends Record<string, unknown>>(
  handler: (request: Request, context: T & { user: AuthUser }) => Promise<NextResponse>
) {
  return async (request: Request, context: T): Promise<NextResponse> => {
    const { user, error } = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add user to context and call handler
    return handler(request, { ...context, user });
  };
}

/**
 * Optional auth - doesn't require authentication but provides user if available
 */
export async function optionalAuth(request: Request): Promise<AuthUser | null> {
  const { user } = await verifyAuth(request);
  return user;
}

/**
 * Check if the requesting user is the owner of a resource
 */
export function isOwner(user: AuthUser, resourceUserId: string): boolean {
  return user.id === resourceUserId;
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

import { NextResponse } from 'next/server';
import { getTransaction } from '@/lib/0g-client';

// GET /api/blockchain/tx?hash=0x... - Get transaction info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');

  if (!hash) {
    return NextResponse.json(
      { error: 'Transaction hash parameter is required' },
      { status: 400 }
    );
  }

  // Validate hash format
  if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return NextResponse.json(
      { error: 'Invalid transaction hash format' },
      { status: 400 }
    );
  }

  try {
    const tx = await getTransaction(hash);

    if (!tx) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction: {
        ...tx,
        blockNumber: tx.blockNumber?.toString() || null,
      },
    });
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

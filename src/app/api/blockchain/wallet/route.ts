import { NextResponse } from 'next/server';
import { getWalletInfo, getBalance, isContract } from '@/lib/0g-client';

// GET /api/blockchain/wallet?address=0x... - Get wallet info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  // Validate address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return NextResponse.json(
      { error: 'Invalid address format' },
      { status: 400 }
    );
  }

  try {
    const [walletInfo, isContractAddress] = await Promise.all([
      getWalletInfo(address),
      isContract(address),
    ]);

    return NextResponse.json({
      wallet: {
        ...walletInfo,
        isContract: isContractAddress,
        type: isContractAddress ? 'contract' : 'eoa',
      },
    });
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet information' },
      { status: 500 }
    );
  }
}

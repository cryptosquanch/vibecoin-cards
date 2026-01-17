import { NextResponse } from 'next/server';
import {
  getBlockNumber,
  getBlock,
  getGasPrice,
} from '@/lib/0g-client';
import { ZERO_G_CHAIN_ID, ZERO_G_RPC_URL, ZERO_G_EXPLORER_URL } from '@/lib/chains';

// GET /api/blockchain - Get blockchain status and info
export async function GET() {
  try {
    const [blockNumber, block, gasPrice] = await Promise.all([
      getBlockNumber(),
      getBlock(),
      getGasPrice(),
    ]);

    return NextResponse.json({
      chain: {
        id: ZERO_G_CHAIN_ID,
        name: '0G Newton Testnet',
        rpcUrl: ZERO_G_RPC_URL,
        explorerUrl: ZERO_G_EXPLORER_URL,
        nativeCurrency: {
          name: '0G',
          symbol: 'A0GI',
          decimals: 18,
        },
      },
      status: {
        connected: true,
        blockNumber: blockNumber.toString(),
        latestBlock: block
          ? {
              number: block.number.toString(),
              timestamp: block.timestamp.toString(),
              hash: block.hash,
              transactions: block.transactions,
              gasUsed: block.gasUsed.toString(),
              gasLimit: block.gasLimit.toString(),
            }
          : null,
        gasPrice: {
          wei: gasPrice.wei,
          gwei: gasPrice.gwei,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get blockchain status:', error);
    return NextResponse.json(
      {
        chain: {
          id: ZERO_G_CHAIN_ID,
          name: '0G Newton Testnet',
        },
        status: {
          connected: false,
          error: 'Failed to connect to 0G testnet',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

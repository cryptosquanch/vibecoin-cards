import { defineChain } from 'viem';

// 0G Newton Testnet Configuration
export const zeroGTestnet = defineChain({
  id: 16600,
  name: '0G Newton Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'A0GI',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://chainscan-newton.0g.ai',
    },
  },
  testnet: true,
});

// Chain constants
export const ZERO_G_CHAIN_ID = 16600;
export const ZERO_G_RPC_URL = process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai';
export const ZERO_G_EXPLORER_URL = 'https://chainscan-newton.0g.ai';

// Contract addresses (to be deployed)
export const CONTRACTS = {
  // Vibecoin platform contracts (placeholder addresses - deploy these)
  VIBECOIN_TOKEN: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  REVENUE_SHARE: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  TRADING_POOL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

// Get explorer URL for transaction
export function getExplorerTxUrl(txHash: string): string {
  return `${ZERO_G_EXPLORER_URL}/tx/${txHash}`;
}

// Get explorer URL for address
export function getExplorerAddressUrl(address: string): string {
  return `${ZERO_G_EXPLORER_URL}/address/${address}`;
}

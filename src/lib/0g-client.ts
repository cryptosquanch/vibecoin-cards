import { createPublicClient, http, formatEther, parseEther, type Address, type Hash } from 'viem';
import { zeroGTestnet, ZERO_G_RPC_URL, getExplorerTxUrl, getExplorerAddressUrl } from './chains';

// Create public client for reading from 0G testnet
export const publicClient = createPublicClient({
  chain: zeroGTestnet,
  transport: http(ZERO_G_RPC_URL),
});

// Types
export interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  nonce: number;
  explorerUrl: string;
}

export interface TransactionInfo {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  valueFormatted: string;
  blockNumber: bigint | null;
  status: 'pending' | 'success' | 'failed';
  explorerUrl: string;
}

export interface BlockInfo {
  number: bigint;
  timestamp: bigint;
  hash: string;
  transactions: number;
  gasUsed: bigint;
  gasLimit: bigint;
}

/**
 * Get wallet information including balance
 */
export async function getWalletInfo(address: string): Promise<WalletInfo> {
  const addr = address as Address;

  const [balance, nonce] = await Promise.all([
    publicClient.getBalance({ address: addr }),
    publicClient.getTransactionCount({ address: addr }),
  ]);

  return {
    address,
    balance: balance.toString(),
    balanceFormatted: formatEther(balance),
    nonce,
    explorerUrl: getExplorerAddressUrl(address),
  };
}

/**
 * Get balance for an address
 */
export async function getBalance(address: string): Promise<{ wei: string; formatted: string }> {
  const balance = await publicClient.getBalance({ address: address as Address });
  return {
    wei: balance.toString(),
    formatted: formatEther(balance),
  };
}

/**
 * Get transaction information
 */
export async function getTransaction(hash: string): Promise<TransactionInfo | null> {
  try {
    const tx = await publicClient.getTransaction({ hash: hash as Hash });

    if (!tx) return null;

    // Try to get receipt for status
    let status: 'pending' | 'success' | 'failed' = 'pending';
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: hash as Hash });
      status = receipt.status === 'success' ? 'success' : 'failed';
    } catch {
      // Transaction is pending
      status = 'pending';
    }

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      valueFormatted: formatEther(tx.value),
      blockNumber: tx.blockNumber,
      status,
      explorerUrl: getExplorerTxUrl(hash),
    };
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return null;
  }
}

/**
 * Get current block number
 */
export async function getBlockNumber(): Promise<bigint> {
  return publicClient.getBlockNumber();
}

/**
 * Get block information
 */
export async function getBlock(blockNumber?: bigint): Promise<BlockInfo | null> {
  try {
    const block = blockNumber
      ? await publicClient.getBlock({ blockNumber })
      : await publicClient.getBlock();

    return {
      number: block.number,
      timestamp: block.timestamp,
      hash: block.hash,
      transactions: block.transactions.length,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
    };
  } catch (error) {
    console.error('Failed to get block:', error);
    return null;
  }
}

/**
 * Get gas price
 */
export async function getGasPrice(): Promise<{ wei: string; gwei: string }> {
  const gasPrice = await publicClient.getGasPrice();
  return {
    wei: gasPrice.toString(),
    gwei: (Number(gasPrice) / 1e9).toFixed(2),
  };
}

/**
 * Check if an address is a contract
 */
export async function isContract(address: string): Promise<boolean> {
  const code = await publicClient.getCode({ address: address as Address });
  return code !== undefined && code !== '0x';
}

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(hash: string, confirmations = 1): Promise<TransactionInfo> {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as Hash,
    confirmations,
  });

  const tx = await publicClient.getTransaction({ hash: hash as Hash });

  return {
    hash: receipt.transactionHash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    valueFormatted: formatEther(tx.value),
    blockNumber: receipt.blockNumber,
    status: receipt.status === 'success' ? 'success' : 'failed',
    explorerUrl: getExplorerTxUrl(hash),
  };
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Parse ETH amount to wei
 */
export function toWei(amount: string | number): bigint {
  return parseEther(amount.toString());
}

/**
 * Format wei to ETH
 */
export function fromWei(wei: bigint | string): string {
  return formatEther(typeof wei === 'string' ? BigInt(wei) : wei);
}

// Export the client for direct use if needed
export { publicClient as zeroGClient };

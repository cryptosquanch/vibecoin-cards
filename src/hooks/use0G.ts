'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, formatEther, parseEther, type Hash } from 'viem';
import { zeroGTestnet, ZERO_G_CHAIN_ID } from '@/lib/chains';

interface TransactionRequest {
  to: string;
  value?: string; // in ETH
  data?: `0x${string}`;
}

interface TransactionResult {
  hash: string;
  explorerUrl: string;
}

export function use0G() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the connected wallet
  const wallet = wallets.find((w) => w.walletClientType === 'privy' || w.connectorType === 'injected');
  const address = wallet?.address || user?.wallet?.address;

  // Get wallet balance from API
  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!address) return null;

    try {
      const response = await fetch(`/api/blockchain/wallet?address=${address}`);
      const data = await response.json();
      return data.wallet?.balanceFormatted || null;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return null;
    }
  }, [address]);

  // Get blockchain status
  const getBlockchainStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain');
      return await response.json();
    } catch (err) {
      console.error('Failed to get blockchain status:', err);
      return null;
    }
  }, []);

  // Send transaction
  const sendTransaction = useCallback(
    async (tx: TransactionRequest): Promise<TransactionResult | null> => {
      if (!wallet || !address) {
        setError('No wallet connected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Switch to 0G network if needed
        await wallet.switchChain(ZERO_G_CHAIN_ID);

        // Get the provider from the wallet
        const provider = await wallet.getEthereumProvider();

        // Create wallet client
        const walletClient = createWalletClient({
          chain: zeroGTestnet,
          transport: custom(provider),
        });

        // Prepare transaction
        const txRequest = {
          account: address as `0x${string}`,
          to: tx.to as `0x${string}`,
          value: tx.value ? parseEther(tx.value) : undefined,
          data: tx.data,
        };

        // Send transaction
        const hash = await walletClient.sendTransaction(txRequest);

        return {
          hash,
          explorerUrl: `https://chainscan-newton.0g.ai/tx/${hash}`,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setError(message);
        console.error('Transaction failed:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, address]
  );

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!wallet || !address) {
        setError('No wallet connected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const provider = await wallet.getEthereumProvider();

        const walletClient = createWalletClient({
          chain: zeroGTestnet,
          transport: custom(provider),
        });

        const signature = await walletClient.signMessage({
          account: address as `0x${string}`,
          message,
        });

        return signature;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signing failed';
        setError(message);
        console.error('Signing failed:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, address]
  );

  // Check transaction status
  const getTransactionStatus = useCallback(async (hash: string) => {
    try {
      const response = await fetch(`/api/blockchain/tx?hash=${hash}`);
      return await response.json();
    } catch (err) {
      console.error('Failed to get transaction status:', err);
      return null;
    }
  }, []);

  return {
    // State
    isConnected: authenticated && !!address,
    address,
    isLoading,
    error,

    // Chain info
    chain: zeroGTestnet,
    chainId: ZERO_G_CHAIN_ID,

    // Actions
    getBalance,
    getBlockchainStatus,
    sendTransaction,
    signMessage,
    getTransactionStatus,

    // Clear error
    clearError: () => setError(null),
  };
}

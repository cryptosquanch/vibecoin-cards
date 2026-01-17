'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { use0G } from '@/hooks/use0G';

export function WalletPanel() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { isConnected, address, chain, chainId, getBalance, isLoading, error } = use0G();
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch balance when connected
  useEffect(() => {
    async function fetchBalance() {
      if (isConnected && address) {
        setBalanceLoading(true);
        const bal = await getBalance();
        setBalance(bal);
        setBalanceLoading(false);
      }
    }
    fetchBalance();
  }, [isConnected, address, getBalance]);

  // Copy address to clipboard
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not ready yet
  if (!ready) {
    return (
      <div className="surface-panel animate-pulse">
        <div className="h-24 bg-botanical-100 rounded-lg" />
      </div>
    );
  }

  // Not connected
  if (!authenticated) {
    return (
      <div className="surface-panel">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-botanical-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="heading-3 mb-2">Connect Your Wallet</h3>
          <p className="text-muted text-sm mb-4">
            Connect to invest in apps and track your portfolio on 0G Network
          </p>
          <button onClick={login} className="btn btn-primary w-full">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Connected
  return (
    <div className="surface-panel">
      {/* Header with network indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-600">Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-botanical-100 rounded-full">
          <div className="w-4 h-4 bg-botanical-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">0G</span>
          </div>
          <span className="text-xs font-medium">Newton Testnet</span>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Wallet Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-botanical-50 px-3 py-2 rounded-lg text-sm font-mono">
            {address ? formatAddress(address) : 'Loading...'}
          </code>
          <button
            onClick={copyAddress}
            className="p-2 hover:bg-botanical-100 rounded-lg transition-colors"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {address && (
            <a
              href={`https://chainscan-newton.0g.ai/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-botanical-100 rounded-lg transition-colors"
              title="View on Explorer"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Balance</p>
        <div className="flex items-baseline gap-2">
          {balanceLoading ? (
            <div className="h-8 w-24 bg-botanical-100 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-2xl font-bold">
                {balance ? parseFloat(balance).toFixed(4) : '0.0000'}
              </span>
              <span className="text-muted">A0GI</span>
            </>
          )}
        </div>
        {balance && parseFloat(balance) < 0.01 && (
          <p className="text-xs text-amber-600 mt-1">
            Low balance - get testnet tokens from the faucet
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <a
          href="https://faucet.0g.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-sm py-2 text-center"
        >
          Get Testnet Tokens
        </a>
        <a
          href={`https://chainscan-newton.0g.ai/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-sm py-2 text-center"
        >
          View History
        </a>
      </div>

      {/* Disconnect */}
      <button
        onClick={logout}
        className="w-full text-center text-sm text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
      >
        Disconnect Wallet
      </button>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

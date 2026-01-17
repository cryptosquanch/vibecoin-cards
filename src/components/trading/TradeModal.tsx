'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { notify } from '@/store';
import { calculateTradeFees, formatFee } from '@/lib/fees';
import { evaluateHand } from '@/lib/hands';
import { FeeBreakdown } from './FeeBreakdown';
import { HandBadge } from '@/components/hands';
import { use0G } from '@/hooks/use0G';
import type { Token } from '@/lib/mock-data';

type TradeType = 'buy' | 'sell';
type TradeStep = 'input' | 'confirm' | 'processing' | 'signing' | 'confirming' | 'success' | 'error';

interface TradeModalProps {
  token: Token;
  isOpen: boolean;
  onClose: () => void;
  initialType?: TradeType;
  referrerAddress?: string; // Optional referrer for fee sharing
  userHoldings?: Token[]; // User's current token holdings for hand calculation
}

export function TradeModal({ token, isOpen, onClose, initialType = 'buy', referrerAddress, userHoldings = [] }: TradeModalProps) {
  const { authenticated, login, getAccessToken } = usePrivy();
  const { isConnected, address, sendTransaction, signMessage, getBalance } = use0G();
  const [tradeType, setTradeType] = useState<TradeType>(initialType);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<TradeStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txExplorerUrl, setTxExplorerUrl] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Mock user's $VIBE stake (in production, fetch from contract)
  const vibeStaked = 0; // User has no $VIBE staked
  const hasReferrer = !!referrerAddress;

  // Fetch balance when connected
  useEffect(() => {
    async function fetchBalance() {
      if (isConnected) {
        const bal = await getBalance();
        setBalance(bal);
      }
    }
    if (isOpen && isConnected) {
      fetchBalance();
    }
  }, [isOpen, isConnected, getBalance]);

  // Calculate user's poker hand from their holdings
  const hand = useMemo(() => evaluateHand(userHoldings), [userHoldings]);
  const handDiscount = hand.feeDiscount;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTradeType(initialType);
      setAmount('');
      setStep('input');
      setError(null);
      setTxHash(null);
      setTxExplorerUrl(null);
    }
  }, [isOpen, initialType]);

  // Calculate totals using the fee system
  const tokenAmount = parseFloat(amount) || 0;

  const fees = useMemo(() => {
    return calculateTradeFees({
      amount: tokenAmount,
      price: token.price,
      type: tradeType,
      hasReferrer,
      vibeStaked,
      handDiscount,
      creatorAddress: token.creator,
      referrerAddress,
    });
  }, [tokenAmount, token.price, tradeType, hasReferrer, vibeStaked, handDiscount, token.creator, referrerAddress]);

  // For backward compatibility
  const totalCost = fees.subtotal;
  const totalWithFee = fees.total;

  // Handle trade submission
  const handleTrade = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (tokenAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setStep('confirm');
  };

  // Confirm and execute trade with real 0G transaction
  const confirmTrade = async () => {
    setStep('signing');
    setError(null);
    setTxHash(null);
    setTxExplorerUrl(null);

    try {
      // Step 1: Sign a message to prove intent (or send small tx as proof)
      // For now, we'll sign a message with trade details
      const tradeMessage = JSON.stringify({
        action: tradeType,
        token: token.symbol,
        tokenId: token.id,
        amount: tokenAmount,
        price: token.price,
        total: fees.total,
        timestamp: Date.now(),
      });

      // Sign the trade intent message
      const signature = await signMessage(`Vibecoin Trade: ${tradeType.toUpperCase()} ${tokenAmount} ${token.symbol} for $${fees.total.toFixed(2)}`);

      if (!signature) {
        throw new Error('Failed to sign transaction. Please try again.');
      }

      setStep('confirming');

      // Step 2: Send a small transaction to record on-chain (0.0001 A0GI as proof)
      // In production, this would call a smart contract
      // For demo, we send a tiny amount to a treasury address with trade data
      const TREASURY_ADDRESS = '0x0000000000000000000000000000000000000000'; // Burn address for demo

      const txResult = await sendTransaction({
        to: TREASURY_ADDRESS,
        value: '0.0001', // Small amount as trade fee/proof
        data: `0x${Buffer.from(tradeMessage).toString('hex')}` as `0x${string}`,
      });

      if (!txResult) {
        throw new Error('Transaction failed. Please check your wallet and try again.');
      }

      setTxHash(txResult.hash);
      setTxExplorerUrl(txResult.explorerUrl);

      setStep('processing');

      // Step 3: Record trade in database with blockchain proof
      const accessToken = await getAccessToken();
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tokenId: token.id,
          type: tradeType.toUpperCase(),
          amount: tokenAmount,
          txHash: txResult.hash,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record trade');
      }

      setStep('success');

      // Refresh balance after trade
      const newBalance = await getBalance();
      setBalance(newBalance);

      // Show success notification
      notify.success(
        `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${tokenAmount.toLocaleString()} ${token.symbol}`,
        `TX: ${txResult.hash.slice(0, 10)}...`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed. Please try again.';
      setError(message);
      setStep('error');

      // Show error notification
      notify.error(
        'Transaction Failed',
        message
      );
    }
  };

  // Close and reset
  const handleClose = () => {
    setStep('input');
    setAmount('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 top-1/2 sm:-translate-x-1/2 -translate-y-1/2 w-auto sm:w-full sm:max-w-md z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                <h2 className="heading-3 text-base sm:text-lg">
                  {step === 'success' ? 'Trade Complete' : `Trade ${token.symbol}`}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-botanical-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Input Step */}
                {step === 'input' && (
                  <>
                    {/* Buy/Sell Toggle */}
                    <div className="flex gap-2 p-1 bg-botanical-100 dark:bg-gray-700 rounded-lg mb-4 sm:mb-6">
                      <button
                        onClick={() => setTradeType('buy')}
                        className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors
                          ${tradeType === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'text-botanical-700 dark:text-gray-300 hover:bg-botanical-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setTradeType('sell')}
                        className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors
                          ${tradeType === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'text-botanical-700 dark:text-gray-300 hover:bg-botanical-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Wallet Balance Banner */}
                    {isConnected && balance && (
                      <div className="flex items-center justify-between p-3 bg-botanical-100 dark:bg-gray-700 rounded-xl mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-botanical-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">0G</span>
                          </div>
                          <span className="text-sm text-muted">Wallet Balance</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{parseFloat(balance).toFixed(4)}</span>
                          <span className="text-xs text-muted">A0GI</span>
                        </div>
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-botanical-50 dark:bg-gray-700 rounded-xl mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-botanical-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-base sm:text-lg font-bold">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{token.name}</p>
                        <p className="text-muted text-xs sm:text-sm">{token.symbol}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm sm:text-base">${token.price.toFixed(4)}</p>
                        <p className={`text-xs sm:text-sm ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Amount ({token.symbol})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-botanical-50 dark:bg-gray-700 border border-botanical-200 dark:border-gray-600 rounded-xl text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-botanical-500"
                        />
                        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
                          <button
                            onClick={() => setAmount('100')}
                            className="px-2 py-1 text-xs bg-botanical-200 dark:bg-gray-600 rounded hover:bg-botanical-300 dark:hover:bg-gray-500"
                          >
                            100
                          </button>
                          <button
                            onClick={() => setAmount('1000')}
                            className="px-2 py-1 text-xs bg-botanical-200 dark:bg-gray-600 rounded hover:bg-botanical-300 dark:hover:bg-gray-500"
                          >
                            1K
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary with Fee Breakdown */}
                    {tokenAmount > 0 && (
                      <div className="space-y-2 mb-4 sm:mb-6 p-3 sm:p-4 bg-botanical-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted">Price per token</span>
                          <span>${token.price.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted">Subtotal</span>
                          <span>{formatFee(fees.subtotal)}</span>
                        </div>

                        {/* Hand Bonus Badge */}
                        {handDiscount > 0 && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted">Your Hand Bonus</span>
                            <HandBadge tokens={userHoldings} />
                          </div>
                        )}

                        {/* Expandable Fee Breakdown */}
                        <FeeBreakdown
                          fees={fees}
                          tradeType={tradeType}
                          vibeStaked={vibeStaked}
                          hasReferrer={hasReferrer}
                          handName={hand.name}
                        />

                        <hr className="border-botanical-200 dark:border-gray-600" />
                        <div className="flex justify-between font-semibold text-sm sm:text-base">
                          <span>{tradeType === 'buy' ? 'You Pay' : 'You Receive'}</span>
                          <span className={tradeType === 'buy' ? 'text-green-600' : 'text-red-500'}>
                            {formatFee(fees.total)}
                          </span>
                        </div>

                        {/* Fee Recipients Preview */}
                        <div className="pt-2 border-t border-botanical-200 dark:border-gray-600 mt-2">
                          <p className="text-xs text-muted mb-1">Fee Distribution:</p>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-botanical-200 dark:bg-gray-600 rounded">
                              Treasury: {formatFee(fees.platformFee)}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              Creator: {formatFee(fees.creatorFee)}
                            </span>
                            {hasReferrer && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                Referrer: {formatFee(fees.referrerFee)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-red-500 text-sm mb-4">{error}</p>
                    )}

                    {/* Action Button */}
                    {authenticated ? (
                      <button
                        onClick={handleTrade}
                        disabled={tokenAmount <= 0}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-colors
                          ${tradeType === 'buy'
                            ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                            : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                          } disabled:cursor-not-allowed`}
                      >
                        {tradeType === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
                      </button>
                    ) : (
                      <button
                        onClick={login}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-botanical-500 hover:bg-botanical-600"
                      >
                        Connect Wallet to Trade
                      </button>
                    )}
                  </>
                )}

                {/* Confirm Step */}
                {step === 'confirm' && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">{tradeType === 'buy' ? '🛒' : '💰'}</span>
                      </div>
                      <h3 className="heading-3 mb-2">Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}</h3>
                      <p className="text-muted">
                        You are about to {tradeType} {tokenAmount.toLocaleString()} {token.symbol}
                      </p>
                    </div>

                    <div className="space-y-2 mb-6 p-4 bg-botanical-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex justify-between">
                        <span className="text-muted">Amount</span>
                        <span className="font-medium">{tokenAmount.toLocaleString()} {token.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Price</span>
                        <span className="font-medium">${token.price.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium">{formatFee(fees.subtotal)}</span>
                      </div>
                      <hr className="border-botanical-200 dark:border-gray-600" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Platform Fee</span>
                        <span>{formatFee(fees.platformFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Creator Fee</span>
                        <span>{formatFee(fees.creatorFee)}</span>
                      </div>
                      {hasReferrer && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Referrer Fee</span>
                          <span>{formatFee(fees.referrerFee)}</span>
                        </div>
                      )}
                      <hr className="border-botanical-200 dark:border-gray-600" />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>{tradeType === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                        <span className={tradeType === 'buy' ? 'text-green-600' : 'text-red-500'}>
                          {formatFee(fees.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('input')}
                        className="flex-1 py-3 rounded-xl font-semibold border border-botanical-200 hover:bg-botanical-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={confirmTrade}
                        className={`flex-1 py-3 rounded-xl font-semibold text-white
                          ${tradeType === 'buy'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                          }`}
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}

                {/* Signing Step */}
                {step === 'signing' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-botanical-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="heading-3 mb-2">Sign Transaction</h3>
                    <p className="text-muted mb-4">Please sign the message in your wallet to confirm your trade intent</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-botanical-600">
                      <div className="w-2 h-2 bg-botanical-500 rounded-full animate-pulse" />
                      Waiting for signature...
                    </div>
                  </div>
                )}

                {/* Confirming Step */}
                {step === 'confirming' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-botanical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-botanical-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="heading-3 mb-2">Confirm Transaction</h3>
                    <p className="text-muted mb-4">Sending transaction to 0G Network...</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-botanical-600">
                      <div className="w-2 h-2 bg-botanical-500 rounded-full animate-pulse" />
                      Confirm in your wallet
                    </div>
                  </div>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-botanical-200 border-t-botanical-500 rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="heading-3 mb-2">Recording Trade...</h3>
                    <p className="text-muted mb-4">Finalizing your trade on the blockchain</p>
                    {txHash && (
                      <div className="p-3 bg-botanical-50 dark:bg-gray-700 rounded-lg inline-block">
                        <p className="text-xs text-muted mb-1">Transaction Hash</p>
                        <code className="text-sm font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
                      </div>
                    )}
                  </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="heading-3 mb-2">Trade Successful!</h3>
                    <p className="text-muted mb-6">
                      You {tradeType === 'buy' ? 'bought' : 'sold'} {tokenAmount.toLocaleString()} {token.symbol}
                    </p>

                    <div className="p-4 bg-botanical-50 dark:bg-gray-700 rounded-xl mb-6 space-y-3">
                      {/* Transaction Hash with Explorer Link */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-sm">Transaction</span>
                        {txHash ? (
                          <a
                            href={txExplorerUrl || `https://chainscan-newton.0g.ai/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-sm text-botanical-600 hover:text-botanical-700"
                          >
                            {txHash.slice(0, 8)}...{txHash.slice(-6)}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="font-mono text-sm">Pending...</span>
                        )}
                      </div>

                      {/* Network */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-sm">Network</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-botanical-500 rounded-full flex items-center justify-center">
                            <span className="text-[6px] font-bold text-white">0G</span>
                          </div>
                          <span className="text-sm">Newton Testnet</span>
                        </div>
                      </div>

                      <hr className="border-botanical-200 dark:border-gray-600" />

                      <div className="flex justify-between">
                        <span className="text-muted">{tradeType === 'buy' ? 'Total Paid' : 'Received'}</span>
                        <span className="font-semibold">{formatFee(fees.total)}</span>
                      </div>

                      {/* Updated Balance */}
                      {balance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Wallet Balance</span>
                          <span className="font-medium">{parseFloat(balance).toFixed(4)} A0GI</span>
                        </div>
                      )}

                      <hr className="border-botanical-200 dark:border-gray-600" />
                      <div className="text-xs text-muted">
                        <p className="mb-1">Fees distributed to:</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-botanical-200 dark:bg-gray-600 rounded">
                            Treasury: {formatFee(fees.platformFee)}
                          </span>
                          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                            Creator: {formatFee(fees.creatorFee)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {txExplorerUrl && (
                        <a
                          href={txExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3 rounded-xl font-semibold border border-botanical-200 hover:bg-botanical-50 text-center"
                        >
                          View on Explorer
                        </a>
                      )}
                      <button
                        onClick={handleClose}
                        className={`${txExplorerUrl ? 'flex-1' : 'w-full'} py-3 rounded-xl font-semibold bg-botanical-500 text-white hover:bg-botanical-600`}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="heading-3 mb-2">Transaction Failed</h3>
                    <p className="text-muted mb-6">{error || 'Something went wrong. Please try again.'}</p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl font-semibold border border-botanical-200 hover:bg-botanical-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setStep('input')}
                        className="flex-1 py-3 rounded-xl font-semibold bg-botanical-500 text-white hover:bg-botanical-600"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

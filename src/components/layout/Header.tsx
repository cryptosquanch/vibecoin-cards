'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ThemeToggle } from '@/components/theme';
import { use0G } from '@/hooks/use0G';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/arena', label: '⚔️ Arena' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Portfolio' },
];

export function Header() {
  const pathname = usePathname();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address, getBalance, isConnected } = use0G();
  const [balance, setBalance] = useState<string | null>(null);

  // Fetch balance when connected
  useEffect(() => {
    async function fetchBalance() {
      if (isConnected && address) {
        const bal = await getBalance();
        setBalance(bal);
      }
    }
    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, getBalance]);

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get display name (wallet address or email)
  const getDisplayName = () => {
    if (!user) return '';
    if (user.wallet?.address) {
      return formatAddress(user.wallet.address);
    }
    if (user.email?.address) {
      return user.email.address.split('@')[0];
    }
    return 'Connected';
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-botanical-200/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-botanical-600">V</span>
          <span className="heading-3 text-lg sm:text-xl">Vibecoin</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-botanical-500 text-white'
                    : 'text-botanical-700 hover:bg-botanical-100'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Wallet Connection */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {!ready ? (
            <div className="btn btn-secondary opacity-50 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
              Loading...
            </div>
          ) : authenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User info with balance - Desktop only */}
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-botanical-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                </div>
                {balance && (
                  <>
                    <div className="w-px h-4 bg-botanical-300" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold">{parseFloat(balance).toFixed(3)}</span>
                      <span className="text-xs text-muted">A0GI</span>
                    </div>
                  </>
                )}
              </div>

              {/* Dropdown menu */}
              <div className="relative group">
                <button className="btn btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                  <span className="hidden sm:inline">Account</span>
                  <span className="sm:hidden">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-botanical-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {/* Mobile user info */}
                  <div className="md:hidden px-4 py-2 border-b border-botanical-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium truncate">{getDisplayName()}</span>
                    </div>
                    {balance && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-semibold">{parseFloat(balance).toFixed(4)}</span>
                        <span className="text-muted">A0GI</span>
                      </div>
                    )}
                  </div>
                  {/* Network indicator */}
                  <div className="px-4 py-2 border-b border-botanical-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-botanical-500 rounded-full flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white">0G</span>
                      </div>
                      <span className="text-xs text-muted">Newton Testnet</span>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm hover:bg-botanical-50 dark:hover:bg-gray-700"
                  >
                    My Portfolio
                  </Link>
                  <Link
                    href="/arena"
                    className="block px-4 py-2 text-sm hover:bg-botanical-50 dark:hover:bg-gray-700"
                  >
                    ⚔️ Battle Arena
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm hover:bg-botanical-50 dark:hover:bg-gray-700"
                  >
                    Achievements
                  </Link>
                  <hr className="my-2 border-botanical-100 dark:border-gray-700" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={login}
              className="btn btn-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-botanical-200/20 px-4 py-2 flex gap-1 overflow-x-auto">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
                ${isActive
                  ? 'bg-botanical-500 text-white'
                  : 'text-botanical-700 dark:text-botanical-300 hover:bg-botanical-100 dark:hover:bg-botanical-800'
                }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

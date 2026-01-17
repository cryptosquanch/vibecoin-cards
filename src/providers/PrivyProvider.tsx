'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { zeroGTestnet } from '@/lib/chains';

// Re-export chain for convenience
export { zeroGTestnet } from '@/lib/chains';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  // Use environment variable or fallback to demo app ID
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl';

  return (
    <Privy
      appId={appId}
      config={{
        // Appearance
        appearance: {
          theme: 'light',
          accentColor: '#2F7F3E', // Botanical green
          logo: '/assets/logo.png',
          showWalletLoginFirst: true,
        },
        // Login methods
        loginMethods: ['wallet', 'email', 'google'],
        // Default chain
        defaultChain: zeroGTestnet,
        // Supported chains
        supportedChains: [zeroGTestnet],
        // Embedded wallets - create for users without external wallets
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </Privy>
  );
}

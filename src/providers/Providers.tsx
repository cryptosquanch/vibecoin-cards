'use client';

import { PrivyProvider } from './PrivyProvider';
import { ThemeProvider } from './ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastContainer } from '@/components/notifications';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/context/theme/ThemeContext';
import './globals.css';
import { ReactQueryProvider } from '@/provider/ReactQueryProvider';
import { NavigationProvider } from '@/context/transition/NavigationContext';
import { ToastProvider } from '@/context/smith/ToastContext';
import LayoutWrapper from '@/component/layoutWrapper/LayoutWrapper';
import { SmithTransactionProvider } from '@/context/smith/SmithTransactionContext';
import { SmithDetailsProvider } from '@/context/smith/useSmithDetails';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js Table App',
  description: 'A beautiful table component with theme support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ReactQueryProvider>
            <NavigationProvider>
              <ToastProvider>
                <LayoutWrapper>
                  <SmithTransactionProvider>
                    <SmithDetailsProvider >
                    {children}
                    </SmithDetailsProvider>
                  </SmithTransactionProvider>
                </LayoutWrapper>
              </ToastProvider>
          </NavigationProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/context/theme/ThemeContext';
import './globals.css';
import { ReactQueryProvider } from '@/provider/ReactQueryProvider';
import { NavigationProvider } from '@/context/transition/NavigationContext';
import { ToastProvider } from '@/context/smith/ToastContext';
import LayoutWrapper from '@/component/layoutWrapper/LayoutWrapper';
import { SmithTransactionProvider } from '@/context/smith/SmithTransactionsContext';
import { SmithDetailsProvider } from '@/context/smith/useSmithDetails';
import { AuthProvider } from '@/context/auth/AuthContext';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        {/* Optional PNG logo for social sharing */}
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:title" content="Danapal Smith Dashboard" />
        <meta property="og:description" content="A beautiful dashboard to manage the smith" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider>
          <ReactQueryProvider>
            <NavigationProvider>
              <ToastProvider>
                <AuthProvider>
                <LayoutWrapper>
                  <SmithTransactionProvider>
                    <SmithDetailsProvider>
                      {children}
                    </SmithDetailsProvider>
                  </SmithTransactionProvider>
                </LayoutWrapper>
                </AuthProvider>
              </ToastProvider>
            </NavigationProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

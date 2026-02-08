// app/layout.tsx
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
import { SoftControlProvider } from '@/context/smith/SoftControlContext';
import { ConfigProvider } from '@/context/Config/ConfigContext';
import HeaderWrapper from '@/component/ui/HeaderWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Danapal Smith Dashboard',
  description: 'A beautiful dashboard to manage the smith',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:title" content="Danapal Smith Dashboard" />
        <meta property="og:description" content="A beautiful dashboard to manage the smith" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ConfigProvider>
            <AuthProvider>
              <ReactQueryProvider>
                <NavigationProvider>
                  <ToastProvider>
                    <SoftControlProvider>
                      <SmithTransactionProvider>
                        <SmithDetailsProvider>
                          <HeaderWrapper />
                          <LayoutWrapper>
                            {children}
                          </LayoutWrapper>
                        </SmithDetailsProvider>
                      </SmithTransactionProvider>
                    </SoftControlProvider>
                  </ToastProvider>
                </NavigationProvider>
              </ReactQueryProvider>
            </AuthProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider, ThemeScript } from '@/src/theme/theme-context';
import { ThemeStudioProvider } from '@/src/theme/theme-studio-context';
import { ConfigProvider } from '@/src/providers/config-provider';
import { ReactQueryProvider } from '@/src/providers/query-provider';
import { NavigationProvider } from '@/src/providers/navigation-provider';
import { ToastProvider } from '@/src/providers/toast-provider';
import { AuthProvider } from '@/src/features/auth/lib/auth-context';
import AppShell from '@/src/components/app-shell/app-shell';
// Providers are imported from their own files, not the module barrel, so the
// root layout does not pull every Smith screen into each page's bundle.
import { SmithDetailsProvider } from '@/src/module/smith/context/smith-details-context';
import { SmithTransactionProvider } from '@/src/module/smith/context/smith-transactions-context';
import { SoftControlProvider } from '@/src/module/smith/context/soft-control-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smith & Gift Voucher | Brightech Software Services',
  description: 'A beautiful dashboard to manage the smith',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:title" content="Smith & Gift Voucher | Brightech Software Services" />
        <meta property="og:description" content="A beautiful dashboard to manage the smith" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
        <ThemeStudioProvider>
          <ConfigProvider>
            <AuthProvider>
              <ReactQueryProvider>
                <NavigationProvider>
                  <ToastProvider>
                    <SoftControlProvider>
                      <SmithTransactionProvider>
                        <SmithDetailsProvider>
                          <AppShell>
                            {children}
                          </AppShell>
                        </SmithDetailsProvider>
                      </SmithTransactionProvider>
                    </SoftControlProvider>
                  </ToastProvider>
                </NavigationProvider>
              </ReactQueryProvider>
            </AuthProvider>
          </ConfigProvider>
        </ThemeStudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
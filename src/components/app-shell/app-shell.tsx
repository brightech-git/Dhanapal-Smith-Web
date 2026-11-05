'use client';

import React, { ReactNode } from 'react';
import HeaderWrapper, { FooterWrapper } from '@/src/components/app-shell/header-wrapper';
import { useEnterNavigation } from '@/src/hooks/use-enter-navigation';

// Page frame: header (hidden on /login) and themed main area. Colors come
// from the CSS tokens in app/globals.css, so they follow the theme studio.
// Also turns on Enter-to-next-field for every form.
const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
    useEnterNavigation();
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <FooterWrapper />
        </div>
    );
};

export default AppShell;

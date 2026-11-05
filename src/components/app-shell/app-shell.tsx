'use client';

import React, { ReactNode } from 'react';
import HeaderWrapper from '@/src/components/app-shell/header-wrapper';

// Page frame: header (hidden on /login) and themed main area. Colors come
// from the CSS tokens in app/globals.css, so they follow the theme studio.
const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
        <HeaderWrapper />
        <main className="flex-1">{children}</main>
    </div>
);

export default AppShell;

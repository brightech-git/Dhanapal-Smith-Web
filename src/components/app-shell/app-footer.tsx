'use client';

import React from 'react';
import { APP_BRANDING } from '@/src/config/branding';

const { developerName, developerLogo, developerWebsite, appName, version } = APP_BRANDING;

// Slim footer: app name and version on one side, the developer on the other.
const AppFooter = () => (
    <footer className="border-t border-border bg-card/80 backdrop-blur">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:px-5 lg:px-6">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground">{appName}</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-primary-text">v{version}</span>
                <span className="hidden sm:inline">·</span>
                <span>&copy; {new Date().getFullYear()} {developerName}. All rights reserved.</span>
            </p>
            <a
                href={developerWebsite}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
            >
                Crafted by
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={developerLogo} alt={`${developerName} logo`} className="h-full w-full object-contain" />
                </span>
                <span className="font-semibold text-foreground">{developerName}</span>
            </a>
        </div>
    </footer>
);

export default AppFooter;

'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from 'gsap';

interface NavigationContextType {
    navigateWithAnimation: (path: string, options?: NavigationOptions) => Promise<void>;
    isNavigating: boolean;
    navigationDirection: 'forward' | 'backward';
    registerPage: (pageRef: React.RefObject<HTMLDivElement>, pageId: string) => void;
    unregisterPage: (pageId: string) => void;
}

interface NavigationOptions {
    direction?: 'forward' | 'backward';
    duration?: number;
    ease?: string;
    onStart?: () => void;
    onComplete?: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
    const router = useRouter();
    const pathname = usePathname();
    const pagesRef = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map());
    const previousPathname = useRef(pathname);

    // Register page elements for animation
    const registerPage = (pageRef: React.RefObject<HTMLDivElement>, pageId: string) => {
        pagesRef.current.set(pageId, pageRef);
    };

    const unregisterPage = (pageId: string) => {
        pagesRef.current.delete(pageId);
    };

    // Enhanced navigation with GSAP animations
    const navigateWithAnimation = async (
        path: string,
        options: NavigationOptions = {}
    ): Promise<void> => {
        const {
            direction = 'forward',
            duration = 1.2,
            ease = 'power3.inOut',
            onStart,
            onComplete
        } = options;

        if (isNavigating || path === pathname) return;

        setIsNavigating(true);
        setNavigationDirection(direction);

        // Get current and target page elements
        const currentPage = pagesRef.current.get(pathname);
        const targetPage = pagesRef.current.get(path);

        // Create animation timeline
        const tl = gsap.timeline({
            defaults: { ease, duration: duration * 0.5 },
            onComplete: () => {
                setIsNavigating(false);
                onComplete?.();
            }
        });

        // Call onStart callback
        onStart?.();

        // Exit animation for current page
        if (currentPage?.current) {
            tl.to(currentPage.current, {
                opacity: 0,
                scale: direction === 'forward' ? 0.95 : 1.05,
                rotationY: direction === 'forward' ? -5 : 5,
                filter: 'blur(10px)',
                duration: duration * 0.4,
            }, 0);
        }

        // Page transition overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
      z-index: 9998;
      opacity: 0;
    `;
        document.body.appendChild(overlay);

        // Overlay animation
        tl.to(overlay, {
            opacity: 0.8,
            duration: duration * 0.2,
        }, duration * 0.2);

        tl.to(overlay, {
            opacity: 0,
            duration: duration * 0.2,
            onComplete: () => {
                document.body.removeChild(overlay);
            }
        }, duration * 0.6);

        // Actual navigation happens in the middle of animation
        tl.add(() => {
            router.push(path);
        }, duration * 0.4);

        // Entry animation for target page
        if (targetPage?.current) {
            tl.fromTo(targetPage.current,
                {
                    opacity: 0,
                    scale: direction === 'forward' ? 1.05 : 0.95,
                    rotationY: direction === 'forward' ? 5 : -5,
                    filter: 'blur(10px)',
                },
                {
                    opacity: 1,
                    scale: 1,
                    rotationY: 0,
                    filter: 'blur(0px)',
                    duration: duration * 0.4,
                    clearProps: "all"
                },
                duration * 0.6
            );
        }

        // Subtle background color transition
        tl.fromTo('body',
            { backgroundColor: 'var(--color-background-start)' },
            { backgroundColor: 'var(--color-background-end)', duration: duration * 0.3 },
            0
        );

        await tl;
    };

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            const direction = pathname > previousPathname.current ? 'backward' : 'forward';
            setNavigationDirection(direction);
        };

        window.addEventListener('popstate', handlePopState);
        previousPathname.current = pathname;

        return () => window.removeEventListener('popstate', handlePopState);
    }, [pathname]);

    const value: NavigationContextType = {
        navigateWithAnimation,
        isNavigating,
        navigationDirection,
        registerPage,
        unregisterPage,
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = (): NavigationContextType => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
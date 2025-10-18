'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useNavigation } from '@/context/transition/NavigationContext';

interface AnimatedPageProps {
    children: React.ReactNode;
    pageId: string;
    className?: string;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({
    children,
    pageId,
    className = ''
}) => {
    const pageRef = useRef<HTMLDivElement>(null!);
    const { registerPage, unregisterPage, isNavigating } = useNavigation();

    useEffect(() => {
        registerPage(pageRef, pageId);

        // Initial page enter animation
        if (pageRef.current) {
            gsap.fromTo(pageRef.current,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.98,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    delay: 0.2
                }
            );
        }

        return () => unregisterPage(pageId);
    }, [pageId, registerPage, unregisterPage]);

    return (
        <div
            ref={pageRef}
            className={`min-h-screen ${className} ${isNavigating ? 'pointer-events-none' : ''}`}
            style={{ opacity: 0 }} // Initial state for GSAP
        >
            {children}
        </div>
    );
};

export default AnimatedPage;
'use client';

import { useState, useEffect } from 'react';
import { getResponsiveSpacing, getResponsiveFontSize, breakpoints } from '@/utils/responsive';

export const useResponsive = () => {
    const [windowSize, setWindowSize] = useState<{
        width: number;
        height: number;
    }>({
        width: 0,
        height: 0,
    });
    const [isSmallMobile ,setIsSmallMobile]=useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setWindowSize({ width, height });
            setIsSmallMobile(width < breakpoints.sm);
            setIsMobile(width < breakpoints.md);
            setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
            setIsDesktop(width >= breakpoints.lg);
        };

        // Set initial size
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const spacing = getResponsiveSpacing(windowSize.width);
    const fontSize = getResponsiveFontSize(windowSize.width);

    return {
        windowSize,
        isSmallMobile,
        isMobile,
        isTablet,
        isDesktop,
        spacing,
        fontSize,
        breakpoints,
    };
};
import { ThemeSpacing, ThemeFontSize } from '@/types/theme';

// Breakpoints matching Tailwind's default
export const breakpoints = {
    xs:450,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

// Base sizes (for desktop)
export const baseSpacing: ThemeSpacing = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
};

export const baseFontSize: ThemeFontSize = {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
};

// Scaling factors for different screen sizes
export const scalingFactors = {
    mobile: 0.85,     // 15% reduction
    tablet: 0.92,     // 8% reduction
    desktop: 1,       // Full size
};

// Convert rem to pixels
const remToPx = (rem: string): number => {
    return parseFloat(rem) * 16;
};

// Convert pixels to rem
const pxToRem = (px: number): string => {
    return `${px / 16}rem`;
};

// Calculate scaled value based on screen width
export const getScaledValue = (baseValue: string, screenWidth: number): string => {
    const basePx = remToPx(baseValue);
    let scaleFactor = scalingFactors.desktop;

    if (screenWidth < breakpoints.sm) {
        scaleFactor = scalingFactors.mobile;
    } else if (screenWidth < breakpoints.lg) {
        scaleFactor = scalingFactors.tablet;
    }

    const scaledPx = basePx * scaleFactor;
    return pxToRem(scaledPx);
};

// Generate responsive spacing scale
export const getResponsiveSpacing = (screenWidth: number): ThemeSpacing => {
    const responsiveSpacing: Partial<ThemeSpacing> = {};

    Object.entries(baseSpacing).forEach(([key, value]) => {
        responsiveSpacing[key as keyof ThemeSpacing] = getScaledValue(value, screenWidth);
    });

    return responsiveSpacing as ThemeSpacing;
};

// Generate responsive font size scale
export const getResponsiveFontSize = (screenWidth: number): ThemeFontSize => {
    const responsiveFontSize: Partial<ThemeFontSize> = {};

    Object.entries(baseFontSize).forEach(([key, value]) => {
        responsiveFontSize[key as keyof ThemeFontSize] = getScaledValue(value, screenWidth);
    });

    return responsiveFontSize as ThemeFontSize;
};

// CSS Custom Properties generator
export const generateResponsiveCSS = (screenWidth: number): string => {
    const spacing = getResponsiveSpacing(screenWidth);
    const fontSize = getResponsiveFontSize(screenWidth);

    let css = ':root {\n';

    // Generate spacing variables
    Object.entries(spacing).forEach(([key, value]) => {
        css += `  --spacing-${key}: ${value};\n`;
    });

    // Generate font size variables
    Object.entries(fontSize).forEach(([key, value]) => {
        css += `  --text-${key}: ${value};\n`;
    });

    css += '}';

    return css;
};
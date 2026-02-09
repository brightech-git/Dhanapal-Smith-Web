
'use client';

import React, { ReactNode } from 'react';
import EnhancedHeader from '../ui/HeaderWrapper';
import { useTheme } from '@/context/theme/ThemeContext';
import Footer from './footer/Footer';
import AnimatedPage from '../Layout/AnimatedPage';

interface LayoutWrapperProps {
    children: ReactNode;
    headerTitle?: string;
    headerSubtitle?: string;
    showSearch?: boolean;
    showUserMenu?: boolean;
    onSearch?: (query: string) => void;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
    children,
    headerTitle = 'Dashboard',
    headerSubtitle = 'Welcome to your dashboard',
    showSearch = true,
    showUserMenu = true,
    onSearch,
}) => {
    const { mode ,theme} = useTheme();
    // console.log(mode ,'mode')
    // Safe theme access with fallbacks
    const getThemeStyles = () => {
        if (mode === 'dark') {
            return {
                background: {
                    primary: theme.colors?.dark?.background?.primary || '#1a1a1a',
                    secondary: theme.colors?.dark?.background?.secondary || '#2d2d2d',
                    card: theme.colors?.dark?.background?.tertiary || '#3d3d3d',
                },
                text: {
                    primary: theme.colors?.dark?.text?.primary || '#ffffff',
                    secondary: theme.colors?.dark?.text?.secondary || '#a0a0a0',
                    tertiary: theme.colors?.dark?.text?.tertiary || '#707070',
                },
                border: '#374151'
            };
        }

        return {
            background: {
                primary: theme.colors?.light?.background?.primary || '#ffffff',
                secondary: theme.colors?.light?.background?.secondary || '#f8f9fa',
                card: theme.colors?.light?.background?.tertiary || '#e9ecef',
            },
            text: {
                primary: theme.colors?.light?.text?.primary || '#1a1a1a',
                secondary: theme.colors?.light?.text?.secondary || '#6c757d',
                tertiary: theme.colors?.light?.text?.tertiary || '#495057',
            },
            border: '#e5e7eb'
        };
    };

    const styles = getThemeStyles();
    return (
        <div className={`flex flex-col transition-colors duration-200 ${mode === 'dark' ? 'dark' : ''}`}>
          
           
            <EnhancedHeader
                // title={headerTitle}
                // subtitle={headerSubtitle}
                // showSearch={showSearch}
                // showUserMenu={showUserMenu}
                // onSearch={onSearch}
                // className="mb-1"
            />

            {/* Main Content */}
            <main className='min-h-100vh' style={{
                background: styles.background.primary,
                color: styles.text.primary,
                minHeight: 'calc(100vh - 5rem)', // Adjust based on your header height
            }}>
                {children}
            </main>
            <Footer />
           
        </div>
    );
};

export default LayoutWrapper;
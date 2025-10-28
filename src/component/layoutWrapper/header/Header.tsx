'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Sun, Moon, User,  Menu, X, Home, Users } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { useNavigation } from '@/context/transition/NavigationContext';
import { gsap } from 'gsap';
import { useAuth } from '@/context/auth/AuthContext';
import { useMediaQuery } from '@mui/material';

import { useSmithTransactionsContext } from '@/context/smith/SmithTransactionsContext';

interface EnhancedHeaderProps {
    title?: string;
    subtitle?: string;
    showSearch?: boolean;
    showUserMenu?: boolean;
    onSearch?: (query: string) => void;
    className?: string;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
    title = 'Dashboard',
    subtitle = 'Welcome to your dashboard',
    showSearch = true,
    showUserMenu = true,
    onSearch,
    className = '',
}) => {
    const { mode, toggleMode, theme } = useTheme();
    const { navigateWithAnimation, isNavigating } = useNavigation();
    const isMobile = useMediaQuery('(max-width: 1279px)');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } =useAuth();
    console.log('user',user);
    const {
            transactions,
           
        } = useSmithTransactionsContext();

    const headerRef = useRef<HTMLElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Safe theme access with fallbacks
    const getHeaderStyles = () => {
        if (mode === 'dark') {
            return {
                background: theme.colors?.dark?.background?.primary || '#1a1a1a',
                borderColor: '#374151',
                text: {
                    primary: theme.colors?.dark?.text?.primary || '#ffffff',
                    secondary: theme.colors?.dark?.text?.secondary || '#a0a0a0',
                },
                hover: {
                    background: '#374151',
                }
            };
        }

        // Light theme with safe access
        return {
            background: theme.colors?.light?.background?.primary || '#ffffff',
            borderColor: '#e5e7eb',
            text: {
                primary: theme.colors?.light?.text?.primary || '#1a1a1a',
                secondary: theme.colors?.light?.text?.secondary || '#6c757d',
            },
            hover: {
                background: '#f3f4f6',
            }
        };
    };

    const styles = getHeaderStyles();

    // Subtle header entrance animation
    useEffect(() => {
        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { y: -50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
            );
        }
    }, []);

  


    // Menu toggle animation
  

    // Navigation handler
    const handleNavigation = (path: string) => {
        navigateWithAnimation(path, {
            direction: 'forward',
            duration: 0.8,
            ease: 'power2.inOut'
        });
        setIsMenuOpen(false);
    };

    // Simplified theme toggle
    const handleThemeToggle = () => {
        toggleMode();
    };

    

    return (
        <>
            <header
                ref={headerRef}
                className={`shadow-sm sticky top-0 z-50 ${className}`}
                style={{
                    opacity: 0, // Initial state for GSAP
                    background: styles.background,
                    borderBottom: `1px solid ${styles.borderColor}`
                }}
            >
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Left Section - Menu & Title */}
                        <div className="flex items-center space-x-3 flex-1">
                          

                            <div
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => handleNavigation('/')}
                            >
                                <h1
                                    className="text-md font-semibold"
                                    style={{ color: styles.text.primary }}
                                >
                                    {title}
                                </h1>
                                
                            </div>
                        </div>

                       

                        {/* Right Section - Actions */}
                        <div className="flex items-center justify-end space-x-2 flex-1">
                          
                           
                            {/* Theme Toggle */}
                            <button
                                onClick={handleThemeToggle}
                                disabled={isNavigating}
                                className="p-1.5 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    color: styles.text.secondary,
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = styles.hover.background;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
                            >
                                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                            </button>

                            {/* User Menu */}
                            {showUserMenu && (
                                <div className="flex items-center space-x-2">
                                    <div className="text-right hidden xl:block">
                                        <p
                                            className="text-sm font-medium"
                                            style={{ color: styles.text.primary }}
                                        >   
                                            {user}
                                        </p>
                                    </div>
                                    <button
                                        disabled={isNavigating}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'transparent',
                                            color: styles.text.secondary,
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease-in-out',
                                           
                                        }}
                                        className=" flex align-center g-1  rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                       
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = styles.hover.background;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <User size={16} />
                                        {isMobile && <span className="ml-2">{user}</span>}

                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                   
                </div>
            </header>

           
            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </>
    );
};

export default EnhancedHeader;
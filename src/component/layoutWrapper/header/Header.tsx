'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Sun, Moon, User, Search, Menu, X, Home, Users } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { useNavigation } from '@/context/transition/NavigationContext';
import { gsap } from 'gsap';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Simplified search focus animation
    const focusSearch = () => {
        if (searchRef.current) {
            gsap.to(searchRef.current, {
                boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(255, 255, 255, 0.1)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    const blurSearch = () => {
        if (searchRef.current) {
            gsap.to(searchRef.current, {
                boxShadow: 'none',
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    // Menu toggle animation
    const toggleMenu = () => {
        if (navRef.current) {
            if (!isMenuOpen) {
                gsap.to(navRef.current, {
                    height: 'auto',
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            } else {
                gsap.to(navRef.current, {
                    height: 0,
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.in'
                });
            }
        }
        setIsMenuOpen(!isMenuOpen);
    };

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

    const navigationItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/smiths/add', icon: Users, label: 'Smith Management' },
    ];

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
                            <button
                                onClick={toggleMenu}
                                className="p-1.5 hover:bg-opacity-50 rounded-md transition-colors duration-200 lg:hidden"
                                style={{
                                    color: styles.text.secondary,
                                    backgroundColor: isMenuOpen ? styles.hover.background : 'transparent'
                                }}
                            >
                                {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
                            </button>

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
                                {/* {subtitle && (
                                    <p
                                        className="text-xs"
                                        style={{ color: styles.text.secondary }}
                                    >
                                        {subtitle}
                                    </p>
                                )} */}
                            </div>
                        </div>

                        {/* Center Section - Search */}
                        {/* {showSearch && (
                            <div className="flex-1 max-w-sm mx-3 hidden md:block">
                                <div className="relative">
                                    <Search
                                        className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5"
                                        style={{ color: styles.text.secondary }}
                                    />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            onSearch?.(e.target.value);
                                        }}
                                        onFocus={focusSearch}
                                        onBlur={blurSearch}
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                        style={{
                                            background: mode === 'dark' ? '#374151' : '#ffffff',
                                            border: `1px solid ${mode === 'dark' ? '#4b5563' : '#d1d5db'}`,
                                            color: styles.text.primary,
                                        }}
                                    />
                                </div>
                            </div>
                        )} */}

                        {/* Right Section - Actions */}
                        <div className="flex items-center justify-end space-x-2 flex-1">
                            {/* Desktop Navigation */}
                            {/* <nav className="hidden lg:flex items-center space-x-1 mr-3">
                                {navigationItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigation(item.path)}
                                            disabled={isNavigating}
                                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                color: styles.text.primary,
                                                backgroundColor: 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = styles.hover.background;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <Icon size={16} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav> */}

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
                                            Aswin
                                        </p>
                                    </div>
                                    <button
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
                                    >
                                        <User size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {/* <div
                        ref={navRef}
                        className="lg:hidden overflow-hidden h-0 opacity-0 mt-2"
                        style={{
                            borderTop: `1px solid ${styles.borderColor}`
                        }}
                    >
                        <nav className="grid grid-cols-2 gap-2 py-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigation(item.path)}
                                        disabled={isNavigating}
                                        className="flex items-center space-x-2 p-2 rounded-md transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            color: styles.text.primary,
                                            backgroundColor: 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = styles.hover.background;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div> */}
                </div>
            </header>

            {/* Simplified Navigation Loader */}
            {isNavigating && (
                <div className="fixed top-0 left-0 w-full h-0.5 bg-primary-500 z-[9999] overflow-hidden">
                    <div className="h-full bg-primary-300 animate-[loading_1.5s_ease-in-out_infinite]"
                        style={{
                            width: '100%',
                            animation: 'loading 1.5s ease-in-out infinite',
                        }}
                    />
                </div>
            )}
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
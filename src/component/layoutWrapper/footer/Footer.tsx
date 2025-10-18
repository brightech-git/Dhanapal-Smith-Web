'use client';

import React from 'react';
import { Home, Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { useNavigation } from '@/context/transition/NavigationContext';

const Footer = () => {
    const { mode, theme } = useTheme();
    const { navigateWithAnimation, isNavigating } = useNavigation();

    // Safe theme access with fallbacks
    const getFooterStyles = () => {
        if (mode === 'dark') {
            return {
                background: theme.colors?.dark?.background?.primary || '#1a1a1a',
                borderColor: '#374151',
                text: {
                    primary: theme.colors?.dark?.text?.primary || '#ffffff',
                    secondary: theme.colors?.dark?.text?.secondary || '#a0a0a0',
                },
                hover: {
                    text: '#ffffff',
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
                text: '#1a1a1a',
            }
        };
    };

    const styles = getFooterStyles();

    // Navigation handler
    const handleNavigation = (path: string) => {
        navigateWithAnimation(path, {
            direction: 'forward',
            duration: 0.8,
            ease: 'power2.inOut'
        });
    };

    const quickLinks = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/smiths/add', label: 'Smith Management' },
        { path: '/about', label: 'About Us' },
        { path: '/privacy', label: 'Privacy Policy' },
        { path: '/terms', label: 'Terms of Service' },
    ];

    const resources = [
        { path: '/blog', label: 'Blog' },
        { path: '/docs', label: 'Documentation' },
        { path: '/support', label: 'Support' },
    ];

    const socialLinks = [
        { href: 'https://x.com/example', icon: Twitter, label: 'X Platform' },
        { href: 'https://linkedin.com/company/example', icon: Linkedin, label: 'LinkedIn' },
        { href: 'https://github.com/example', icon: Github, label: 'GitHub' },
    ];

    const contactInfo = [
        {
            type: 'email',
            value: 'support@example.com',
            href: 'mailto:support@example.com',
            icon: Mail
        },
        {
            type: 'phone',
            value: '+1 (234) 567-890',
            href: 'tel:+1234567890',
            icon: Phone
        },
        {
            type: 'address',
            value: '123 Smith St, City, Country',
            icon: MapPin
        },
    ];

    return (
        <footer className="" style={{ background: styles.background  , borderTop: `1px solid ${styles.borderColor}`, }}>
           
               

                {/* Bottom Bar */}
                <div
                className="pt-2 flex justify-center  mx-auto  max-w-6xl text-center text-xs gap-5"
                    style={{
                       
                        color: styles.text.secondary
                    }}
                >
                    <p>
                        &copy; {new Date().getFullYear()} Smith Management System. All rights reserved.
                    </p>
                    <p>
                        Creafted by BrightechSoftwareSolutions
                    </p>
                </div>
          
        </footer>
    );
};

export default Footer;
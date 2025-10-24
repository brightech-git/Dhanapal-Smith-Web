'use client';

import React from 'react';
import { Home, Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { useNavigation } from '@/context/transition/NavigationContext';
import companyLogo from '../../../../public/logo/com-logo.jpg';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // ✅ Correct import for App Router

const Footer = () => {
    const { mode, theme } = useTheme();
    const { navigateWithAnimation } = useNavigation();
    const router = useRouter(); // ✅ Works fine in client component

    const styles = mode === 'dark'
        ? {
            background: theme.colors?.dark?.background?.primary || '#1a1a1a',
            borderColor: '#374151',
            text: { primary: '#ffffff', secondary: '#a0a0a0' },
        }
        : {
            background: theme.colors?.light?.background?.primary || '#ffffff',
            borderColor: '#e5e7eb',
            text: { primary: '#1a1a1a', secondary: '#6c757d' },
        };

    return (
        <footer
            style={{
                background: styles.background,
                borderTop: `1px solid ${styles.borderColor}`,
            }}
        >
            <div
                className="
    pt-2 
    flex flex-col sm:flex-row  /* stack on small, row on ≥640px */
    justify-center items-center 
    mx-auto max-w-7xl 
    text-center text-xs 
    gap-2 sm:gap-5            /* tighter gap on mobile */
  "
                style={{ color: styles.text.secondary }}
            >
                <p>
                    &copy; {new Date().getFullYear()} Smith Management System. All rights reserved.
                </p>

                <p
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => window.open('https://www.brightechsoftware.com/', '_blank')}
                >
                    Crafted by
                    <Image
                        src={companyLogo}
                        height={20}
                        width={20}
                        alt="logo"
                    />
                    <span>Brightech Software Solutions</span>
                </p>
            </div>

        </footer>
    );
};

export default Footer;

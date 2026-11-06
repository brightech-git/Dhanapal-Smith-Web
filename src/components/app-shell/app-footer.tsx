'use client';

import React from 'react';
import { Home, Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import { useNavigation } from '@/src/providers/navigation-provider';
import { useRouter } from 'next/navigation'; // ✅ Correct import for App Router

const Footer = () => {
    return (
        <footer
            className="border-t border-border bg-card"
        >
            <div
                className="
    p-3 
    flex flex-col sm:flex-row  /* stack on small, row on ≥640px */
    justify-center items-center 
    mx-auto max-w-7xl 
    text-center text-xs 
    gap-2 sm:gap-5            /* tighter gap on mobile */
    text-muted-foreground
  "
            >
                <p>
                    &copy; {new Date().getFullYear()} Smith Suite. All rights reserved.
                </p>
            </div>

        </footer>
    );
};

export default Footer;

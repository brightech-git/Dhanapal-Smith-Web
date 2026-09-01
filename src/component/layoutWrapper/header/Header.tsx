'use client';

import React, { useRef, useEffect, useState } from "react";
import {
  Sun,
  Moon,
  User,
  Menu,
  X,
  Home,
  Users
} from "lucide-react";
import { useTheme } from "@/context/theme/ThemeContext";
import { useNavigation } from "@/context/transition/NavigationContext";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import { useMediaQuery } from "@mui/material";

interface EnhancedHeaderProps {
  className?: string;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({ className = "" }) => {
  const { mode, toggleMode, theme } = useTheme();
  const { navigateWithAnimation, isNavigating } = useNavigation();
  const { allDetails } = useAuth();
  const pathname = usePathname();

  const isMobile = useMediaQuery("(max-width: 1279px)");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Orders", path: "/smiths/order", icon: Menu },
    { label: "Users", path: "/smiths/create", icon: Users },
  ];

  const styles =
    mode === "dark"
      ? {
          bg: "#1a1a1a",
          text: "#fff",
          subText: "#9ca3af",
          hover: "#2d3748",
          active: "#374151",
        }
      : {
          bg: "#1e3a8a",
          text: "#fff",
          subText: "#bfdbfe",
          hover: "#2563eb",
          active: "#3b82f6",
        };

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    );
  }, []);

  useEffect(() => {
    if (!mobileMenuRef.current || !overlayRef.current) return;

    if (isMenuOpen) {
      gsap.to(overlayRef.current, { opacity: 1, pointerEvents: "auto" });
      gsap.fromTo(
        mobileMenuRef.current,
        { x: "-100%" },
        { x: "0%", duration: 0.4, ease: "power3.out" }
      );
    } else {
      gsap.to(mobileMenuRef.current, {
        x: "-100%",
        duration: 0.3,
        ease: "power3.in",
      });
      gsap.to(overlayRef.current, { opacity: 0, pointerEvents: "none" });
    }
  }, [isMenuOpen]);

  const handleNavigation = (path: string) => {
    navigateWithAnimation(path, { direction: "forward" });
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        ref={overlayRef}
        onClick={() => setIsMenuOpen(false)}
        className="fixed inset-0 bg-black/40 z-40 opacity-0 pointer-events-none"
      />

      {/* Mobile Drawer */}
      <div
        ref={mobileMenuRef}
        className="fixed top-0 left-0 h-full w-64 z-50 shadow-xl"
        style={{ background: styles.bg }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {allDetails?.USERNAME || "Admin"}
            </p>
            <span className="text-xs" style={{ color: styles.subText }}>
              Administrator
            </span>
          </div>
          <button onClick={() => setIsMenuOpen(false)}>
            <X color="white" />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const isActive =
              path === "/" ? pathname === "/" : pathname.startsWith(path);

            return (
              <button
                key={path}
                onClick={() => handleNavigation(path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  background: isActive ? styles.active : "transparent",
                  color: styles.text,
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Header */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-30 shadow ${className}`}
        style={{ background: styles.bg }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <Menu color="white" />
              </button>
            )}
            <div
              className="cursor-pointer"
              onClick={() => handleNavigation("/")}
            >
              {/* <h1 className="text-white font-bold text-lg">
                Dhanapal Jewellery
              </h1> */}
              <p className="text-xs" style={{ color: styles.subText }}>
                Smith Dashboard
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          {!isMobile && (
            <div className="flex gap-2">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const isActive =
                  path === "/" ? pathname === "/" : pathname.startsWith(path);

                return (
                  <button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                    style={{
                      background: isActive ? styles.active : "transparent",
                      color: styles.text,
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              {mode === "light" ? (
                <Moon color="white" size={18} />
              ) : (
                <Sun color="white" size={18} />
              )}
            </button>

            {!isMobile && (
              <div className="flex items-center gap-2">
                <User color="white" size={18} />
                <span className="text-sm text-white">
                  {allDetails?.USERNAME || "Admin"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default EnhancedHeader;

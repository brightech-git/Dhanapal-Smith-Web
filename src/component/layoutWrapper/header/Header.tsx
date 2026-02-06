'use client';

import React, { useRef, useEffect, useState } from "react";
import { Sun, Moon, User, Menu, X, Home, Users } from "lucide-react";
import { useTheme } from "@/context/theme/ThemeContext";
import { useNavigation } from "@/context/transition/NavigationContext";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import { useMediaQuery } from "@mui/material";

import { useSmithTransactionsContext } from "@/context/smith/SmithTransactionsContext";

interface EnhancedHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showUserMenu?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  title = "Dashboard",
  subtitle = "Welcome to your Dashboard",
  showSearch = true,
  showUserMenu = true,
  onSearch,
  className = "",
}) => {
  const { mode, toggleMode, theme } = useTheme();
  const { navigateWithAnimation, isNavigating } = useNavigation();
  const isMobile = useMediaQuery("(max-width: 1279px)");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { allDetails } = useAuth();
  const NAV_ITEMS = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Orders", path: "/smiths/order", icon: Menu },
    { label: "Users", path: "/smiths/create", icon: Users },
  ];
  const pathname = usePathname();

  const { transactions } = useSmithTransactionsContext();

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Safe theme access with fallbacks
  const getHeaderStyles = () => {
    if (mode === "dark") {
      return {
        background: theme.colors?.dark?.background?.primary || "#1a1a1a",
        borderColor: "#374151",
        text: {
          primary: theme.colors?.dark?.text?.primary || "#ffffff",
          secondary: theme.colors?.dark?.text?.secondary || "#a0a0a0",
        },
        hover: {
          background: "#2a4365",
        },
        active: {
          background: "#2c5282",
        }
      };
    }

    // Light theme with blue theme
    return {
      background: "#1e3a8a",
      borderColor: "#1d4ed8",
      text: {
        primary: "#ffffff",
        secondary: "#bfdbfe",
      },
      hover: {
        background: "#2563eb",
      },
      active: {
        background: "#3b82f6",
      }
    };
  };

  const styles = getHeaderStyles();

  // Subtle header entrance animation
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      );
    }
  }, []);

  // Navigation handler
  const handleNavigation = (path: string) => {
    navigateWithAnimation(path, {
      direction: "forward",
      duration: 0.8,
      ease: "power2.inOut",
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
        className={`shadow-lg sticky top-0 z-50 ${className}`}
        style={{
          opacity: 0,
          background: styles.background,
          borderBottom: `1px solid ${styles.borderColor}`,
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Menu & Title */}
            <div className="flex items-center space-x-3 flex-1">
              <div
                className="cursor-pointer flex flex-col"
                onClick={() => handleNavigation("/")}
              >
                <h1
                  className="text-lg font-bold tracking-wide"
                  style={{ color: styles.text.primary }}
                >
                  Company Name
                </h1>
                <span
                  className="text-xs font-medium"
                  style={{ color: styles.text.secondary }}
                >
                  Smith Dashboard
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-1">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const isActive =
                  path === "/" ? pathname === "/" : pathname.startsWith(path);

                return (
                  <button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isActive
                        ? styles.active.background
                        : "transparent",
                      color: isActive
                        ? '#ffffff'
                        : styles.text.secondary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = styles.hover.background;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center justify-end space-x-3 flex-1">
              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                disabled={isNavigating}
                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                style={{
                  color: styles.text.primary,
                  backgroundColor: "transparent",
                }}
                title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
              >
                {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* User Menu */}
              {showUserMenu && (
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden xl:block">
                    <p
                      className="text-sm font-medium"
                      style={{ color: styles.text.primary }}
                    >
                      {allDetails?.USERNAME || allDetails?.userName || "admin"}
                    </p>
                    <span 
                      className="text-xs"
                      style={{ color: styles.text.secondary }}
                    >
                      Administrator
                    </span>
                  </div>
                  <button
                    disabled={isNavigating}
                    className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/10 transition-colors"
                    style={{
                      color: styles.text.primary,
                      backgroundColor: "transparent",
                    }}
                  >
                    <User size={18} />
                    {isMobile && (
                      <span className="ml-1 text-sm">
                        {allDetails?.USERNAME || allDetails?.userName || "admin"}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default EnhancedHeader;
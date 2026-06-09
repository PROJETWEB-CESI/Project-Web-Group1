'use client';

import { usePathname } from 'next/navigation';
import LogoLink from './LogoLink';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    if (isDashboard) {
        // Non-floating header integrated above the sidebar layout.
        // Same background and border style as the sidebar for seamless look.
        return (
            <div className="w-full px-3 py-3 flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <LogoLink />
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                    <ThemeToggle />
                    <ProfileMenu />
                </div>
            </div>
        );
    }

    // Default fixed header for non-dashboard pages (e.g. login, public routes).
    return (
        <div className="fixed top-0 left-0 right-0 px-3 py-3 z-50 flex items-center justify-between bg-[var(--header-background)]">
            <LogoLink />
            <div className="flex items-center gap-3">
                <LanguageToggle />
                <ThemeToggle />
                <ProfileMenu />
            </div>
        </div>
    );
}

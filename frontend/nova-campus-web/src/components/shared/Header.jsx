'use client';

import LogoLink from './LogoLink';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { isAuthenticated, loading } = useAuth();

    return (
        <div className="fixed top-0 left-0 right-0 px-3 py-3 z-50 flex items-center justify-between bg-[var(--header-background)] lg:bg-transparent lg:style={{ backdropFilter: 'blur(5px)' }}">
            <LogoLink />
            <div className="flex items-center gap-3">
                <LanguageToggle />
                <ThemeToggle />
                <ProfileMenu />
            </div>
        </div>
    );
}

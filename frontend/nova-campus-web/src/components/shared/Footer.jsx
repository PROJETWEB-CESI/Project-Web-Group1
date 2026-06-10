'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const { translate } = useLanguage();
  const pathname = usePathname();

  // Detect if we're on the login page
  const isLoginPage = pathname === '/login' || pathname?.startsWith('/login');

  // Color logic
  const textColor = isLoginPage
    ? "text-[var(--color-text)] lg:text-[var(--color-on-primary)]"
    : "text-[var(--color-text)]";

  return (
    <footer
      className="text-[var(--color-on-primary)] py-4"
      // blur
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <div className="mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
        {/* <div className={`md:mr-auto ${textColor}`}>
          © {new Date().getFullYear()} NovaCampus Alliance. All rights reserved.
        </div> */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <Link href="/accessibility" className="hover:text-[var(--color-text)] transition-colors">
            {translate('accessibility')}
          </Link>
          <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">
            {translate('privacyPolicy')}
          </Link>
          <a
            href="mailto:support@novacampus.fr"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            {translate('contact')}
          </a>
        </div>
      </div>
    </footer >
  );
}

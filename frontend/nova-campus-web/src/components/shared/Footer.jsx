'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { translate } = useLanguage();

  return (
    <footer className="bg-transparent text-[var(--color-on-primary)] py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-4 text-sm">
        <div className="md:mr-auto">
          © {new Date().getFullYear()} NovaCampus Alliance. All rights reserved.
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">
            {translate('privacyPolicy')}
          </Link>
          <Link href="/accessibility" className="hover:text-[var(--color-text)] transition-colors">
            {translate('accessibility')}
          </Link>
          <a 
            href="mailto:support@novacampus.fr" 
            className="hover:text-[var(--color-text)] transition-colors"
          >
            {translate('contact')}
          </a>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] text-[var(--color-text-muted)] py-8 mt-auto border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div>
          © {new Date().getFullYear()} NovaCampus Alliance. All rights reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/accessibility" className="hover:text-[var(--color-text)] transition-colors">
            Accessibility
          </Link>
          <a 
            href="mailto:support@novacampus.fr" 
            className="hover:text-[var(--color-text)] transition-colors"
          >
            Contact
          </a>
        </div>
        <div className="text-xs text-[var(--color-text-muted)]/80">
          GDPR-compliant data processing • Inclusive and accessible design.
        </div>
      </div>
    </footer>
  );
}

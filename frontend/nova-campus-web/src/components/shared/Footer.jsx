import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div>
          © {new Date().getFullYear()} NovaCampus Alliance. All rights reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/accessibility" className="hover:text-white transition-colors">
            Accessibility
          </Link>
          <a 
            href="mailto:support@novacampus.fr" 
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>
        <div className="text-xs text-gray-500">
          Committed to GDPR compliance and inclusive design.
        </div>
      </div>
    </footer>
  );
}

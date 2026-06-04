export const metadata = {
  title: 'Accessibility | NovaCampus',
};

export default function AccessibilityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Accessibility Statement</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Our Commitment</h2>
      <p className="mb-4">
        NovaCampus Alliance is committed to making its digital services accessible to everyone, 
        including people with disabilities. We aim to conform to the{' '}
        <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="underline">WCAG 2.2</a> level AA 
        guidelines and the French RGAA (Référentiel Général d’Amélioration de l’Accessibilité).
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Current Accessibility Features</h2>
      <ul className="list-disc pl-6 space-y-1 mb-4">
        <li>Full support for light, dark, and high-contrast themes (persisted preference, system-aware)</li>
        <li>High-contrast mode uses calculated luminance ratios for proper readability (never low-contrast pairs like white on yellow)</li>
        <li>Keyboard accessible navigation and focus management</li>
        <li>Proper form labels, ARIA attributes, and semantic HTML</li>
        <li>Text resizing and responsive design</li>
        <li>Clear error messages and privacy notices</li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Limitations &amp; Ongoing Work</h2>
      <p className="mb-4">
        This platform is under active development. Some parts of the interface (dashboards, complex tables, third-party 
        embeds) may not yet be fully accessible. We are continuously improving based on testing and feedback.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Feedback &amp; Contact</h2>
      <p>
        If you encounter accessibility barriers or have suggestions, please contact us via the{' '}
        <a href="mailto:support@novacampus.fr" className="underline">support email</a> or the contact link in the footer.
        We aim to respond to accessibility feedback within 5 working days.
      </p>

      <p className="text-sm text-[var(--color-text-muted)] mt-8">
        This is a placeholder accessibility statement. A full audit and conformance declaration will be provided 
        by the institution’s accessibility team.
      </p>
    </main>
  );
}

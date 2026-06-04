export const metadata = {
  title: 'Privacy Policy | NovaCampus',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Your Data, Your Rights</h2>
      <p className="mb-4">
        NovaCampus Alliance processes personal data (email, name, academic records, campus affiliation) 
        solely for the purpose of providing educational services, authentication, and academic administration.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Legal Basis (GDPR)</h2>
      <ul className="list-disc pl-6 space-y-1 mb-4">
        <li>Contract performance (enrolment and service delivery)</li>
        <li>Legal obligations (French higher education regulations)</li>
        <li>Legitimate interest (secure platform operation)</li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">Your Rights</h2>
      <p className="mb-4">
        You may request access, rectification, erasure, restriction, or data portability at any time by contacting 
        your campus data protection officer or via the contact link in the footer.
      </p>

      <p className="text-sm text-[var(--color-text-muted)] mt-8">
        This is a placeholder policy page. A full legal version will be provided by the institution’s legal team.
      </p>
    </main>
  );
}

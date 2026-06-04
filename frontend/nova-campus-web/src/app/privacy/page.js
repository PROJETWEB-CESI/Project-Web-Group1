export const metadata = {
  title: 'Privacy Policy | NovaCampus',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray">
      <h1>Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)]">
        Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2>Your Data, Your Rights</h2>
      <p>
        NovaCampus Alliance processes personal data (email, name, academic records, campus affiliation) 
        solely for the purpose of providing educational services, authentication, and academic administration.
      </p>

      <h2>Legal Basis (GDPR)</h2>
      <ul>
        <li>Contract performance (enrolment and service delivery)</li>
        <li>Legal obligations (French higher education regulations)</li>
        <li>Legitimate interest (secure platform operation)</li>
      </ul>

      <h2>Your Rights</h2>
      <p>
        You may request access, rectification, erasure, restriction, or data portability at any time by contacting 
        your campus data protection officer or via the contact link in the footer.
      </p>

      <p className="text-sm text-[var(--color-text-muted)] mt-8">
        This is a placeholder policy page. A full legal version will be provided by the institution’s legal team.
      </p>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

const TABS = [
  { key: 'information', labelKey: 'profileTabInfo' },
  { key: 'security',    labelKey: 'profileTabSecurity' },
  { key: 'notifications', labelKey: 'profileTabNotifications' },
  { key: 'display',    labelKey: 'profileTabDisplay' },
  { key: 'sessions',   labelKey: 'profileTabSessions' },
];

export default function StudentProfilePage() {
  const router   = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { translate } = useLanguage();

  const [activeTab, setActiveTab] = useState('information');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    phone:      '',
    address:    '',
  });
  const [original, setOriginal] = useState({});
  const [programLabel, setProgramLabel] = useState('');

  // Redirect if not authenticated once auth is resolved
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load student profile from academic service
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/academic/students/me', {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error(translate('profileLoadError'));
        return res.json();
      })
      .then(data => {
        const fields = {
          first_name: data.first_name ?? '',
          last_name:  data.last_name  ?? '',
          email:      data.email      ?? user?.email ?? '',
          phone:      data.phone      ?? '',
          address:    [data.address, data.zip_code, data.city]
            .filter(Boolean).join(', '),
        };
        setForm(fields);
        setOriginal(fields);
        setProgramLabel(
          [data.program_id, data.campus_id].filter(Boolean).join(' - ')
        );
        setProfileLoading(false);
      })
      .catch(err => {
        // Fall back gracefully: show what we know from auth token
        const fields = {
          first_name: '',
          last_name:  '',
          email:      user?.email ?? '',
          phone:      '',
          address:    '',
        };
        setForm(fields);
        setOriginal(fields);
        setError(err.message);
        setProfileLoading(false);
      });
  }, [isAuthenticated, user]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError(null);
  }

  function handleCancel() {
    setForm(original);
    setSuccess(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/academic/students/me', {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name:  form.last_name,
          phone:      form.phone,
          address:    form.address,
        }),
      });
      if (!res.ok) throw new Error(translate('profileSaveError'));
      setOriginal(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Loading states
  if (authLoading || profileLoading) {
    return <PageShell><Skeleton /></PageShell>;
  }

  const initials = [form.first_name?.[0], form.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ')
    || user?.email || '';

  return (
    <PageShell>
      <h1 style={{ color: 'var(--color-text)' }}
        className="text-xl font-medium mb-5">
        {translate('myProfile')}
      </h1>

      <div className="flex gap-4 items-start">

        {/* Sidebar */}
        <aside
          style={{
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: '0.75rem',
          }}
          className="w-44 shrink-0 p-4 flex flex-col gap-1"
        >
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 pb-4 mb-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--color-primary)',
                color:      'var(--color-on-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 500, flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {initials}
            </div>

            <p style={{ color: 'var(--color-text)' }}
              className="text-sm font-medium text-center leading-tight">
              {fullName}
            </p>

            {programLabel && (
              <p style={{ color: 'var(--color-text-muted)' }}
                className="text-xs text-center leading-snug">
                {programLabel}
              </p>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="text-xs mt-1 w-full"
              onClick={() => {}}
              aria-label={translate('changePhoto')}
            >
              {translate('changePhoto')}
            </Button>
          </div>

          {/* Nav tabs */}
          <nav aria-label={translate('profileNav')}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: activeTab === tab.key
                    ? 'color-mix(in oklch, var(--color-primary) 12%, transparent)'
                    : 'transparent',
                  color: activeTab === tab.key
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                  fontWeight: activeTab === tab.key ? 500 : 400,
                }}
              >
                {translate(tab.labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main panel */}
        <main
          style={{
            flex: 1,
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: '0.75rem',
          }}
          className="p-6"
        >
          {activeTab === 'information' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }}
                className="text-sm font-medium mb-5">
                {translate('personalInformation')}
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  label={translate('firstName')}
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                <Input
                  label={translate('lastName')}
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  label={translate('emailAddress')}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled
                  aria-describedby="email-note"
                />
                <Input
                  label={translate('phone')}
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
              <p id="email-note" style={{ color: 'var(--color-text-muted)' }}
                className="text-xs mb-3 -mt-1">
                {translate('emailReadOnly')}
              </p>

              <div className="mb-5">
                <Input
                  label={translate('address')}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                />
              </div>

              {error && (
                <p className="error-message mb-3" role="alert">{error}</p>
              )}
              {success && (
                <p style={{ color: 'var(--color-success)' }}
                  className="text-sm mb-3" role="status">
                  {translate('profileSaveSuccess')}
                </p>
              )}

              {/* Actions - cancel left, save right (project convention) */}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                  {translate('cancel')}
                </Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  {translate('save')}
                </Button>
              </div>
            </>
          )}

          {activeTab !== 'information' && (
            <div className="flex items-center justify-center h-32"
              style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm">
                {translate('profileTabComingSoon')} - {translate(
                  TABS.find(t => t.key === activeTab)?.labelKey
                )}
              </p>
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}
      className="px-8 py-8">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading profile">
      <div style={{ background: 'var(--color-border)', borderRadius: '6px' }}
        className="h-6 w-28 mb-5" />
      <div className="flex gap-4">
        <div style={{ background: 'var(--color-border)', borderRadius: '0.75rem' }}
          className="w-44 h-64 shrink-0" />
        <div style={{ background: 'var(--color-border)', borderRadius: '0.75rem' }}
          className="flex-1 h-64" />
      </div>
    </div>
  );
}

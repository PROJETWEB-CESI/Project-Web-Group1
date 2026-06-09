'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

const TABS = [
  { key: 'information',    labelKey: 'profileTabInfo' },
  { key: 'security',       labelKey: 'profileTabSecurity' },
  { key: 'notifications',  labelKey: 'profileTabNotifications' },
  { key: 'display',        labelKey: 'profileTabDisplay' },
  { key: 'sessions',       labelKey: 'profileTabSessions' },
];

// ── Notification settings (frontend-only state, no backend needed) ───────────
const NOTIFICATION_ITEMS = [
  { key: 'roomChange',    labelKey: 'notifRoomChange' },
  { key: 'newGrade',      labelKey: 'notifNewGrade' },
  { key: 'payment',       labelKey: 'notifPayment' },
  { key: 'teacherMsg',    labelKey: 'notifTeacherMsg' },
  { key: 'adminAnnounce', labelKey: 'notifAdminAnnounce' },
];

const DEFAULT_NOTIFS = {
  roomChange:    { email: true,  inApp: true,  push: true  },
  newGrade:      { email: true,  inApp: true,  push: false },
  payment:       { email: true,  inApp: false, push: false },
  teacherMsg:    { email: true,  inApp: true,  push: true  },
  adminAnnounce: { email: true,  inApp: false, push: false },
};

// ── Mock sessions (frontend-only, realistic demo data) ───────────────────────
const MOCK_SESSIONS = [
  { id: 1, device: 'MacBook Pro - Safari', location: 'Lyon, France',  lastActive: 'sessionNow',    current: true  },
  { id: 2, device: 'iPhone 15 - Application', location: 'Lyon, France',  lastActive: 'session4h',  current: false },
  { id: 3, device: 'Chrome - Windows',     location: 'Paris, France', lastActive: 'session3d',     current: false },
];

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { translate } = useLanguage();
  const { theme, setTheme, isHighContrast } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [activeTab,      setActiveTab]      = useState('information');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [error,          setError]          = useState(null);

  // Information tab
  const [form, setForm]         = useState({ first_name: '', last_name: '', email: '', phone: '', address: '' });
  const [original, setOriginal] = useState({});
  const [programLabel, setProgramLabel] = useState('');

  // Photo
  const [photoUrl,   setPhotoUrl]   = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // Security tab
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState(null);

  // Notifications tab
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  // Sessions tab
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  // ── Helper: get stored token for Authorization header ────────────────────
  // The IAM service issues Bearer tokens stored in localStorage by AuthContext
  function authHeader() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  // ── Load student profile ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/academic/students/me', {
      credentials: 'include',
      headers: authHeader(),
    })
      .then(res => { if (!res.ok) throw new Error(translate('profileLoadError')); return res.json(); })
      .then(data => {
        const fields = {
          first_name: data.first_name ?? '',
          last_name:  data.last_name  ?? '',
          email:      data.email      ?? user?.email ?? '',
          phone:      data.phone      ?? '',
          address:    [data.address, data.zip_code, data.city].filter(Boolean).join(', '),
        };
        setForm(fields);
        setOriginal(fields);
        setProgramLabel([data.program_id, data.campus_id].filter(Boolean).join(' - '));
        if (data.photo_url) setPhotoUrl(data.photo_url);
        setProfileLoading(false);
      })
      .catch(() => {
        setForm({ first_name: '', last_name: '', email: user?.email ?? '', phone: '', address: '' });
        setOriginal({ first_name: '', last_name: '', email: user?.email ?? '', phone: '', address: '' });
        setProfileLoading(false);
      });
  }, [isAuthenticated, user]);

  // ── Information handlers ─────────────────────────────────────────────────
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false); setError(null);
  }
  function handleCancel() { setForm(original); setSuccess(false); setError(null); }
  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const res = await fetch('/api/academic/students/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, address: form.address }),
      });
      if (!res.ok) throw new Error(translate('profileSaveError'));
      setOriginal(form); setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // ── Photo upload handler — local preview only, no backend needed ────────
  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError(translate('photoInvalidType')); return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError(translate('photoTooLarge')); return;
    }

    setPhotoError(null);
    // Show instantly as a local blob URL — no server needed
    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl);
  }

  // Security tab handler
  function handlePwChange(e) {
    setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPwError(null);
  }

  // ── Notifications handler ────────────────────────────────────────────────
  function toggleNotif(key, channel) {
    setNotifs(prev => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));
  }

  // ── Sessions handler ─────────────────────────────────────────────────────
  function revokeSession(id) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  // ── Render guards ────────────────────────────────────────────────────────
  if (authLoading || profileLoading) return <PageShell><Skeleton /></PageShell>;

  const initials = [form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ') || user?.email || '';

  return (
    <PageShell>
      {/* Page title */}
      <h1 style={{ color: 'var(--color-text)' }} className="text-xl font-medium mb-1">
        {translate('myProfile')}
      </h1>
      <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-5">
        {translate('profileSubtitle')}
      </p>

      <div className="flex gap-4 items-start">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}
          className="w-44 shrink-0 p-4 flex flex-col gap-1">

          <div className="flex flex-col items-center gap-2 pb-4 mb-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}>

            {/* Avatar — shows uploaded photo or initials fallback */}
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              {photoUrl ? (
                <img src={photoUrl} alt={fullName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 500 }}
                  aria-hidden="true">
                  {initials}
                </div>
              )}

            </div>

            <p style={{ color: 'var(--color-text)' }} className="text-sm font-medium text-center leading-tight">{fullName}</p>
            {programLabel && <p style={{ color: 'var(--color-text-muted)' }} className="text-xs text-center leading-snug">{programLabel}</p>}

            {/* Hidden file input — triggered by the button below */}
            <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handlePhotoChange} aria-label={translate('changePhoto')} />

            <Button variant="secondary" size="sm" className="text-xs mt-1 w-full"
              onClick={() => document.getElementById('photo-upload').click()}>
              {translate('changePhoto')}
            </Button>

            {photoError && (
              <p className="error-message text-center" role="alert" style={{ fontSize: '0.65rem' }}>{photoError}</p>
            )}
          </div>

          <nav aria-label={translate('profileNav')}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: '6px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                  background: activeTab === tab.key ? 'color-mix(in oklch, var(--color-primary) 12%, transparent)' : 'transparent',
                  color:      activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: activeTab === tab.key ? 500 : 400 }}>
                {translate(tab.labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main panel ────────────────────────────────────────────────── */}
        <main style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}
          className="p-6">

          {/* INFORMATION */}
          {activeTab === 'information' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }} className="text-sm font-medium mb-5">{translate('personalInformation')}</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label={translate('firstName')} name="first_name" value={form.first_name} onChange={handleChange} autoComplete="given-name" />
                <Input label={translate('lastName')}  name="last_name"  value={form.last_name}  onChange={handleChange} autoComplete="family-name" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label={translate('emailAddress')} name="email" type="email" value={form.email} disabled autoComplete="email" aria-describedby="email-note" />
                <Input label={translate('phone')} name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" />
              </div>
              <p id="email-note" style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-3 -mt-1">{translate('emailReadOnly')}</p>
              <div className="mb-5">
                <Input label={translate('address')} name="address" value={form.address} onChange={handleChange} autoComplete="street-address" />
              </div>
              {error   && <p className="error-message mb-3" role="alert">{error}</p>}
              {success && <p style={{ color: 'var(--color-success)' }} className="text-sm mb-3" role="status">{translate('profileSaveSuccess')}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>{translate('cancel')}</Button>
                <Button variant="primary"   onClick={handleSave}   loading={saving}>{translate('save')}</Button>
              </div>
            </>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }} className="text-sm font-medium mb-5">
                {translate('profileTabSecurity')}
              </h2>

              <div className="flex flex-col gap-3 mb-4">

                {/* Current password */}
                <Input
                  label={translate('currentPassword')}
                  name="current"
                  type="password"
                  value={pwForm.current}
                  onChange={handlePwChange}
                  autoComplete="current-password"
                />

                {/* New password */}
                <Input
                  label={translate('newPassword')}
                  name="next"
                  type="password"
                  value={pwForm.next}
                  onChange={handlePwChange}
                  autoComplete="new-password"
                />

                {/* Strength bar + rules — appear as soon as user types */}
                {pwForm.next.length > 0 && (() => {
                  const rules = [
                    pwForm.next.length >= 8,
                    /[A-Z]/.test(pwForm.next),
                    /[0-9]/.test(pwForm.next),
                    /[^A-Za-z0-9]/.test(pwForm.next),
                  ];
                  const score  = rules.filter(Boolean).length;
                  const colors = isHighContrast
                    ? ['var(--color-text)', 'var(--color-text)', 'var(--color-text)', 'var(--color-primary)']
                    : ['#ef4444','#f97316','#eab308','#22c55e'];
                  const labels = [
                    translate('strengthWeak'),
                    translate('strengthFair'),
                    translate('strengthGood'),
                    translate('strengthStrong'),
                  ];
                  return (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      {/* Bar */}
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px',
                            background: i < score ? colors[score - 1] : 'var(--color-border)',
                            transition: 'background 0.2s' }} />
                        ))}
                      </div>
                      {/* Label */}
                      <p style={{ fontSize: '0.75rem', color: colors[score - 1] || 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                        {labels[score - 1] || translate('strengthWeak')}
                      </p>
                      {/* Compact inline rules */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                        <StrengthRule ok={rules[0]} label={translate('passwordRuleLength')}  />
                        <StrengthRule ok={rules[1]} label={translate('passwordRuleUpper')}   />
                        <StrengthRule ok={rules[2]} label={translate('passwordRuleNumber')}  />
                        <StrengthRule ok={rules[3]} label={translate('passwordRuleSpecial')} />
                      </div>
                    </div>
                  );
                })()}

                {/* Confirm password */}
                <Input
                  label={translate('confirmPassword')}
                  name="confirm"
                  type="password"
                  value={pwForm.confirm}
                  onChange={handlePwChange}
                  autoComplete="new-password"
                  error={pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm
                    ? translate('passwordMismatch') : undefined}
                />

                {/* Passwords match confirmation */}
                {pwForm.confirm.length > 0 && pwForm.next === pwForm.confirm && (
                  <p style={{ color: 'var(--color-success)', fontSize: '0.8rem' }} role="status">
                    ✓ {translate('passwordMatch')}
                  </p>
                )}
              </div>

              {/* 2FA notice */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '12px 16px', marginBottom: '20px' }}
                className="text-sm">
                <span style={{ color: 'var(--color-text)' }} className="font-medium">{translate('twoFactor')} </span>
                <span style={{ color: 'var(--color-text-muted)' }}>{translate('twoFactorOff')} </span>
                <button style={{ color: 'var(--color-link)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}>
                  {translate('twoFactorEnable')}
                </button>
              </div>

              {/* Actions — Save is greyed out until all conditions are met */}
              {(() => {
                const allRulesPass = pwForm.next.length >= 8
                  && /[A-Z]/.test(pwForm.next)
                  && /[0-9]/.test(pwForm.next)
                  && /[^A-Za-z0-9]/.test(pwForm.next);
                const canSave = pwForm.current.length > 0
                  && allRulesPass
                  && pwForm.next === pwForm.confirm;
                return (
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary"
                      onClick={() => setPwForm({ current: '', next: '', confirm: '' })}>
                      {translate('cancel')}
                    </Button>
                    <Button variant="primary" disabled={!canSave}
                      onClick={() => {
                        // Backend not connected yet — form is ready when this is enabled
                        setPwForm({ current: '', next: '', confirm: '' });
                      }}>
                      {translate('save')}
                    </Button>
                  </div>
                );
              })()}
            </>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }} className="text-sm font-medium mb-5">{translate('profileTabNotifications')}</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table">
                <tbody>
                  {NOTIFICATION_ITEMS.map((item, idx) => (
                    <tr key={item.key}
                      style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 0', color: 'var(--color-text)', fontSize: '0.875rem' }}>
                        {translate(item.labelKey)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 0', width: '200px' }}>
                        <div className="flex items-center justify-end gap-6">
                          <Toggle checked={notifs[item.key].email}  onChange={() => toggleNotif(item.key, 'email')}  label="EMAIL" />
                          <Toggle checked={notifs[item.key].inApp}  onChange={() => toggleNotif(item.key, 'inApp')}  label="IN-APP" />
                          <Toggle checked={notifs[item.key].push}   onChange={() => toggleNotif(item.key, 'push')}   label="PUSH" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Column headers row */}
                  <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td />
                    <td style={{ paddingTop: '8px', width: '200px' }}>
                      <div className="flex items-center justify-end gap-6">
                        {['EMAIL', 'IN-APP', 'PUSH'].map(col => (
                          <span key={col} style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', letterSpacing: '0.05em', width: '36px', textAlign: 'center' }}>
                            {col}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* DISPLAY */}
          {activeTab === 'display' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }} className="text-sm font-medium mb-5">{translate('profileTabDisplay')}</h2>

              {/* Theme selector */}
              <div className="mb-5">
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-2">{translate('theme')}</p>
                <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '4px', gap: '2px' }}>
                  {[
                    { value: 'light',         labelKey: 'light' },
                    { value: 'dark',          labelKey: 'dark'  },
                    { value: 'high-contrast', labelKey: 'highContrast' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setTheme(opt.value)}
                      style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s ease',
                        background: theme === opt.value ? 'var(--color-surface)' : 'transparent',
                        color:      theme === opt.value ? 'var(--color-text)'    : 'var(--color-text-muted)',
                        fontWeight: theme === opt.value ? 500 : 400,
                        boxShadow:  theme === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                      {translate(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selector */}
              <div>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-2">{translate('language')}</p>
                <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '4px', gap: '2px' }}>
                  {[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English'  },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setLanguage(opt.value)}
                      style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s ease',
                        background: language === opt.value ? 'var(--color-surface)' : 'transparent',
                        color:      language === opt.value ? 'var(--color-text)'    : 'var(--color-text-muted)',
                        fontWeight: language === opt.value ? 500 : 400,
                        boxShadow:  language === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SESSIONS */}
          {activeTab === 'sessions' && (
            <>
              <h2 style={{ color: 'var(--color-text)' }} className="text-sm font-medium mb-4">{translate('activeSessions')}</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['sessionDevice', 'sessionLocation', 'sessionLastActive'].map(col => (
                      <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {translate(col)}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 12px', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                        <span>{session.device}</span>
                        {session.current && (
                          <span style={{ marginLeft: '8px', background: 'color-mix(in oklch, var(--color-success) 15%, transparent)', color: 'var(--color-success)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 500 }}>
                            {translate('sessionCurrent')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        {session.location}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        {translate(session.lastActive)}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        {!session.current && (
                          <Button variant="secondary" size="sm" onClick={() => revokeSession(session.id)}>
                            {translate('sessionRevoke')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        </main>
      </div>
    </PageShell>
  );
}

// ── Password strength rule indicator ─────────────────────────────────────────
function StrengthRule({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: ok ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.7rem' }}>
      <span>{ok ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Toggle switch component ───────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      style={{ width: '36px', height: '20px', borderRadius: '999px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '2px', transition: 'background 0.2s ease',
        background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-on-primary)', transition: 'transform 0.2s ease',
        transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }} className="px-8 py-8">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading profile">
      <div style={{ background: 'var(--color-border)', borderRadius: '6px' }} className="h-6 w-28 mb-5" />
      <div className="flex gap-4">
        <div style={{ background: 'var(--color-border)', borderRadius: '0.75rem' }} className="w-44 h-64 shrink-0" />
        <div style={{ background: 'var(--color-border)', borderRadius: '0.75rem' }} className="flex-1 h-64" />
      </div>
    </div>
  );
}
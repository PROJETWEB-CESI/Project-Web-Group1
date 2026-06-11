'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useApi } from '@/lib/api';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

function describeSession(userAgent) {
  if (!userAgent) return 'Unknown device';

  let browser = 'Unknown browser';
  if (/Edg\//.test(userAgent)) browser = 'Edge';
  else if (/Chrome\//.test(userAgent)) browser = 'Chrome';
  else if (/Firefox\//.test(userAgent)) browser = 'Firefox';
  else if (/Safari\//.test(userAgent)) browser = 'Safari';

  let os = 'Unknown OS';
  if (/Windows/.test(userAgent)) os = 'Windows';
  else if (/Mac OS X/.test(userAgent)) os = 'macOS';
  else if (/Android/.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad/.test(userAgent)) os = 'iOS';
  else if (/Linux/.test(userAgent)) os = 'Linux';

  return `${browser} on ${os}`;
}

function formatSessionDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '-';
  }
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { translate } = useLanguage();
  const { apiFetch } = useApi();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('informations');

  const isStudent = user?.role === 'student' && !!user?.studentId;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [program, setProgram] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Load current profile (IAM user + academic record for students)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const base = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: '',
      address: '',
      city: '',
      zipCode: '',
      emergencyContact: '',
      emergencyPhone: '',
    };

    if (!isStudent) {
      setFormData(base);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    apiFetch(`/api/students/${user.studentId}?campusId=${user.campusId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFormData({
          ...base,
          firstName: data.firstName || base.firstName,
          lastName: data.lastName || base.lastName,
          email: base.email,
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          zipCode: data.zipCode || '',
          emergencyContact: data.emergencyContact || '',
          emergencyPhone: data.emergencyPhone || '',
        });
        setProgram(data.program || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isStudent]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setProfileMessage(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const userRes = await apiFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        }),
      });
      const userData = await userRes.json().catch(() => ({}));
      if (!userRes.ok) {
        throw new Error(userData.error || translate('profileSaveError') || 'Could not update profile.');
      }

      if (isStudent) {
        const studentRes = await apiFetch(`/api/students/${user.studentId}?campusId=${user.campusId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
          }),
        });
        const studentData = await studentRes.json().catch(() => ({}));
        if (!studentRes.ok) {
          throw new Error(studentData.error || translate('profileSaveError') || 'Could not update profile.');
        }
      }

      setUser((prev) => (prev ? { ...prev, ...userData.user } : userData.user));
      setProfileMessage({ type: 'success', text: translate('profileSaved') || 'Profile updated successfully.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // Security tab: change password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordMessage(null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: translate('passwordTooShort') || 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: translate('passwordMismatch') || 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiFetch('/api/auth/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || translate('passwordChangeError') || 'Could not change the password.');
      }
      setPasswordMessage({ type: 'success', text: translate('passwordChanged') || 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  // Notifications tab: server-side preferences
  const [notifPrefs, setNotifPrefs] = useState({ email: true, inApp: true });
  const [notifSaved, setNotifSaved] = useState(false);
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [notifMessage, setNotifMessage] = useState(null);

  useEffect(() => {
    if (!user) return;
    setNotifPrefs({
      email: user.emailNotifications !== false,
      inApp: user.inAppNotifications !== false,
    });
  }, [user]);

  const handleNotifToggle = (key) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setNotifSaved(false);
  };

  const handleSaveNotifPrefs = async (e) => {
    e.preventDefault();
    setSavingNotifPrefs(true);
    setNotifMessage(null);
    setNotifSaved(false);
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: notifPrefs.email,
          inAppNotifications: notifPrefs.inApp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || translate('preferencesSaveError') || 'Could not save preferences.');
      }
      setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } catch (err) {
      setNotifMessage({ type: 'error', text: err.message });
    } finally {
      setSavingNotifPrefs(false);
    }
  };

  // Sessions tab: real session list from the server
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  const loadSessions = () => {
    setLoadingSessions(true);
    apiFetch('/api/auth/sessions')
      .then((res) => (res.ok ? res.json() : { sessions: [] }))
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  };

  useEffect(() => {
    if (activeTab !== 'sessions') return;
    loadSessions();
  }, [activeTab]);

  const handleRevokeSession = async (sessionId) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await apiFetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } finally {
      setRevokingSessionId(null);
    }
  };

  const tabs = [
    { key: 'informations', label: translate('tabInformations') || 'Information' },
    { key: 'securite', label: translate('tabSecurity') || 'Security' },
    { key: 'notifications', label: translate('tabNotifications') || 'Notifications' },
    { key: 'affichage', label: translate('tabDisplay') || 'Display' },
    { key: 'sessions', label: translate('tabSessions') || 'Sessions' },
  ];

  const initials = `${(formData.firstName || '?')[0] || '?'}${(formData.lastName || '?')[0] || '?'}`.toUpperCase();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myProfile') || 'My profile'}</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {translate('myProfileSubtitle') || 'Manage your personal information and preferences.'}
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar / summary card */}
        <div className="w-full lg:w-64 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-elev)] flex flex-col items-center h-fit">
          <div className="h-20 w-20 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-3xl font-bold mb-3">
            {initials}
          </div>
          <div className="text-center">
            <div className="font-medium">{formData.firstName} {formData.lastName}</div>
            {isStudent && program && (
              <div className="text-xs text-[var(--color-text-muted)]">{program.programName}</div>
            )}
            <div className="text-xs text-[var(--color-text-muted)] mt-1 capitalize">{user?.role}</div>
          </div>
        </div>

        {/* Main form + tabs */}
        <div className="flex-1 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-sm whitespace-nowrap ${activeTab === t.key ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'informations' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={translate('firstName') || 'First name'}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loadingProfile}
                    required
                  />
                  <Input
                    label={translate('lastName') || 'Last name'}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loadingProfile}
                    required
                  />
                </div>
                <Input
                  label={translate('emailAddress') || 'Email address'}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loadingProfile}
                  required
                />

                {isStudent && (
                  <>
                    <Input
                      label={translate('phone') || 'Phone'}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loadingProfile}
                    />
                    <Input
                      label={translate('address') || 'Address'}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={loadingProfile}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={translate('city') || 'City'}
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={loadingProfile}
                      />
                      <Input
                        label={translate('zipCode') || 'Zip code'}
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        disabled={loadingProfile}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={translate('emergencyContact') || 'Emergency contact'}
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        disabled={loadingProfile}
                      />
                      <Input
                        label={translate('emergencyPhone') || 'Emergency phone'}
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        disabled={loadingProfile}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={savingProfile} disabled={loadingProfile}>
                    {translate('saveChanges') || 'Save changes'}
                  </Button>
                  {profileMessage && (
                    <span className={`text-sm ${profileMessage.type === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                      {profileMessage.text}
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'securite' && (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input
                  label={translate('currentPassword') || 'Current password'}
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <Input
                  label={translate('newPassword') || 'New password'}
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  minLength={8}
                  required
                />
                <Input
                  label={translate('confirmPassword') || 'Confirm new password'}
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  minLength={8}
                  required
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={savingPassword}>
                    {translate('changePassword') || 'Change password'}
                  </Button>
                  {passwordMessage && (
                    <span className={`text-sm ${passwordMessage.type === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                      {passwordMessage.text}
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveNotifPrefs} className="space-y-4 max-w-md">
                <h2 className="text-sm font-medium text-[var(--color-text)]">
                  {translate('notificationsPreferencesTitle') || 'Notification preferences'}
                </h2>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefs.email}
                    onChange={() => handleNotifToggle('email')}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--color-text)]">
                      {translate('emailNotifications') || 'Email notifications'}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {translate('emailNotificationsHint') || 'Receive an email for important updates.'}
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefs.inApp}
                    onChange={() => handleNotifToggle('inApp')}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--color-text)]">
                      {translate('inAppNotifications') || 'In-app notifications'}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {translate('inAppNotificationsHint') || 'Show notifications in the bell menu.'}
                    </span>
                  </span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={savingNotifPrefs}>
                    {translate('save') || 'Save'}
                  </Button>
                  {notifSaved && (
                    <span className="text-sm text-[var(--color-success)]">
                      {translate('preferencesSaved') || 'Preferences saved.'}
                    </span>
                  )}
                  {notifMessage && (
                    <span className="text-sm text-[var(--color-error)]">
                      {notifMessage.text}
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'affichage' && (
              <div className="space-y-4 max-w-md">
                <h2 className="text-sm font-medium text-[var(--color-text)]">
                  {translate('displayTheme') || 'Theme'}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'light', label: translate('themeLight') || 'Light' },
                    { key: 'dark', label: translate('themeDark') || 'Dark' },
                    { key: 'high-contrast', label: translate('themeHighContrast') || 'High contrast' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTheme(opt.key)}
                      className={`px-4 py-2 rounded-lg border text-sm transition ${theme === opt.key ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium' : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)]'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4 max-w-md">
                <h2 className="text-sm font-medium text-[var(--color-text)]">
                  {translate('sessionsTitle') || 'Active sessions'}
                </h2>

                {loadingSessions ? (
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {translate('loading') || 'Loading...'}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {translate('sessionsNone') || 'No active sessions found.'}
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="border border-[var(--color-border)] rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm text-[var(--color-text)]">
                            {describeSession(session.userAgent)}
                            {session.isCurrent && (
                              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] align-middle">
                                {translate('sessionsCurrentDevice') || 'This device'}
                              </span>
                            )}
                          </div>
                          {session.ipAddress && (
                            <div className="text-xs text-[var(--color-text-muted)] mt-1">
                              {session.ipAddress}
                            </div>
                          )}
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            {(translate('sessionsLastActive') || 'Last active')}: {formatSessionDate(session.lastUsedAt)}
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={revokingSessionId === session.id}
                            className="!text-[var(--color-error)] hover:!bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)]"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            {translate('sessionsRevoke') || 'Revoke'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <SignOutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignOutButton() {
  const { logout } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  const handleClick = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="!text-[var(--color-error)] hover:!bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)]"
      onClick={handleClick}
    >
      {translate('signOutThisDevice') || 'Sign out from this device'}
    </Button>
  );
}

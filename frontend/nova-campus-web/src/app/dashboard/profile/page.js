'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Profile / Settings page, integrated in dashboard main content (like other pages).
 * Merged "Profile" and "Settings" into one (as per sidebar mockup "Profil").
 * Uses current CSS tokens.
 * Functional form (local state for demo; will sync with backend user profile later).
 * Tabs from mockup: Informations, Sécurité, Notifications, Affichage, Sessions.
 */

export default function ProfilePage() {
  const { user } = useAuth();
  const { translate } = useLanguage();
  const [activeTab, setActiveTab] = useState('informations');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || 'Léa',
    lastName: user?.lastName || 'Moreau',
    email: user?.email || 'lea.moreau@et u.novacampus.fr',
    phone: '+33 6 12 34 56 78',
    address: '12 rue de l\'Université, 69007 Lyon',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Demo: "save" locally
    console.log('Profile saved (demo):', formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Later: POST to /api/users/me or iam update
  };

  const tabs = [
    { key: 'informations', label: translate('informations') || 'Informations' },
    { key: 'securite', label: 'Sécurité' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'affichage', label: 'Affichage' },
    { key: 'sessions', label: 'Sessions' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Mon profil</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">Gérez vos informations personnelles et préférences.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar / summary card (from mockup) */}
        <div className="w-full lg:w-64 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-elev)] flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-3xl font-bold mb-3">
            {formData.firstName[0]}{formData.lastName[0]}
          </div>
          <button className="text-sm text-[var(--color-primary)] hover:underline mb-4">Changer la photo</button>
          <div className="text-center">
            <div className="font-medium">{formData.firstName} {formData.lastName}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Bachelor Business International · Campus Paris</div>
          </div>
        </div>

        {/* Main form + tabs */}
        <div className="flex-1 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
            {tabs.map(t => (
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
              <form onSubmit={handleSave} className="space-y-4 max-w-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Prénom</label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-bg)] text-[var(--color-text)]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Nom</label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-bg)] text-[var(--color-text)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-bg)] text-[var(--color-text)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Téléphone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-bg)] text-[var(--color-text)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Adresse</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-bg)] text-[var(--color-text)]" />
                </div>
                <button type="submit" className="mt-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded text-sm hover:opacity-90">
                  Enregistrer
                </button>
                {saved && <span className="text-sm text-[var(--color-success)] ml-3">Enregistré (demo)</span>}
              </form>
            )}

            {activeTab !== 'informations' && (
              <div className="text-[var(--color-text-muted)] text-sm">
                Contenu de l'onglet « {tabs.find(t => t.key === activeTab)?.label} » (démo).<br />
                (Sécurité : changer mot de passe, 2FA · Notifications : préférences · Affichage : thème · Sessions : déconnexions actives)
                <br />Implémentation complète à venir avec backend user profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

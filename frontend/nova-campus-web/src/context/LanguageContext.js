'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const LANGUAGES = ['en', 'fr'];

// Simple bilingual translations.
// Keys are used via t('key').
// Add more keys here as the UI grows. Keep English as the source of truth.
const translations = {
  en: {
    // Login page
    welcomeBack: 'Welcome back',
    signInToAccess: 'Sign in to access your dashboard',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign in',
    forgotPassword: 'Forgot your password?',
    forgotPasswordHelp: 'For security reasons, password resets must be requested through your campus administration office. Please contact support.',
    privacyNoticePrefix: 'By signing in you agree to the processing of your personal data as described in our',
    privacyNoticeSuffix: 'We only collect what is necessary for authentication and academic services (GDPR Art. 5).',
    needAccount: 'Need an account?',
    needAccountContact: 'Contact your educational administrator or campus office.',
    // Branding (left panel)
    shapingMinds: 'Shaping Tomorrow’s Minds',
    secureAccess: 'Secure access to schedules, grades, and academic services across all campuses.',
    gdprTagline: 'GDPR compliant • Accessible to all • Multi-campus',
    // Theme labels (used by ThemeToggle when language changes)
    light: 'Light',
    dark: 'Dark',
    highContrast: 'High Contrast',
    // General / footer
    privacyPolicy: 'Privacy Policy',
    accessibility: 'Accessibility',
    contact: 'Contact',
    // Loading / misc
    checkingSession: 'Checking your session...',
    // Language toggle
    language: 'Language',
    // Privacy / Accessibility additional keys (fallbacks are in the pages for now)
    yourDataRights: 'Your Data, Your Rights',
    privacyDataProcessing: 'NovaCampus Alliance processes personal data (email, name, academic records, campus affiliation) solely for the purpose of providing educational services, authentication, and academic administration.',
    legalBasis: 'Legal Basis (GDPR)',
    basisContract: 'Contract performance (enrolment and service delivery)',
    basisLegal: 'Legal obligations (French higher education regulations)',
    basisInterest: 'Legitimate interest (secure platform operation)',
    yourRights: 'Your Rights',
    rightsText: 'You may request access, rectification, erasure, restriction, or data portability at any time by contacting your campus data protection officer or via the contact link in the footer.',
    placeholderPolicy: 'This is a placeholder policy page. A full legal version will be provided by the institution’s legal team.',
    // 404 page
    pageNotFound: 'Page not found',
    pageNotFoundDesc: 'Sorry, the page you are looking for does not exist or has been moved.',
    backToLogin: 'Go back to login',
    returnHome: 'Return to home',
    contactSupport: 'If you believe this is an error, please contact your campus support.',
  },
  fr: {
    // Login page
    welcomeBack: 'Bienvenue',
    signInToAccess: 'Connectez-vous pour accéder à votre tableau de bord',
    emailAddress: 'Adresse e-mail',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    forgotPassword: 'Mot de passe oublié ?',
    forgotPasswordHelp: 'Pour des raisons de sécurité, les réinitialisations de mot de passe doivent être demandées auprès du service administratif de votre campus. Veuillez contacter le support.',
    privacyNoticePrefix: 'En vous connectant, vous acceptez le traitement de vos données personnelles tel que décrit dans notre',
    privacyNoticeSuffix: 'Nous ne collectons que ce qui est nécessaire pour l’authentification et les services académiques (RGPD Art. 5).',
    needAccount: 'Besoin d’un compte ?',
    needAccountContact: 'Contactez votre administrateur pédagogique ou le bureau de votre campus.',
    // Branding
    shapingMinds: 'Façonner les esprits de demain',
    secureAccess: 'Accès sécurisé aux emplois du temps, notes et services académiques sur tous les campus.',
    gdprTagline: 'Conforme RGPD • Accessible à tous • Multi-campus',
    // Theme
    light: 'Clair',
    dark: 'Sombre',
    highContrast: 'Contraste élevé',
    // Footer
    privacyPolicy: 'Politique de confidentialité',
    accessibility: 'Accessibilité',
    contact: 'Contact',
    // Misc
    checkingSession: 'Vérification de votre session...',
    language: 'Langue',
    yourDataRights: 'Vos données, vos droits',
    privacyDataProcessing: 'L’Alliance NovaCampus traite les données personnelles (e-mail, nom, dossiers académiques, affiliation au campus) uniquement dans le but de fournir des services éducatifs, l’authentification et l’administration académique.',
    legalBasis: 'Base légale (RGPD)',
    basisContract: 'Exécution du contrat (inscription et fourniture de services)',
    basisLegal: 'Obligations légales (réglementation de l’enseignement supérieur français)',
    basisInterest: 'Intérêt légitime (fonctionnement sécurisé de la plateforme)',
    yourRights: 'Vos droits',
    rightsText: 'Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données à tout moment en contactant le délégué à la protection des données de votre campus ou via le lien de contact dans le pied de page.',
    placeholderPolicy: 'Ceci est une page de politique placeholder. Une version légale complète sera fournie par l’équipe juridique de l’établissement.',
    // Accessibility page
    accessibilityStatement: 'Accessibility Statement',
    ourCommitment: 'Our Commitment',
    commitmentText: 'NovaCampus Alliance is committed to making its digital services accessible to everyone, including people with disabilities. We aim to conform to the WCAG 2.2 level AA guidelines and the French RGAA (Référentiel Général d’Amélioration de l’Accessibilité).',
    currentFeatures: 'Current Accessibility Features',
    featureThemes: 'Full support for light, dark, and high-contrast themes (persisted preference, system-aware)',
    featureContrast: 'High-contrast mode uses calculated luminance ratios for proper readability (never low-contrast pairs like white on yellow)',
    featureKeyboard: 'Keyboard accessible navigation and focus management',
    featureLabels: 'Proper form labels, ARIA attributes, and semantic HTML',
    featureResponsive: 'Text resizing and responsive design',
    featureErrors: 'Clear error messages and privacy notices',
    limitations: 'Limitations & Ongoing Work',
    limitationsText: 'This platform is under active development. Some parts of the interface (dashboards, complex tables, third-party embeds) may not yet be fully accessible. We are continuously improving based on testing and feedback.',
    feedback: 'Feedback & Contact',
    feedbackText: 'If you encounter accessibility barriers or have suggestions, please contact us via the support email or the contact link in the footer. We aim to respond to accessibility feedback within 5 working days.',
    placeholderAccessibility: 'This is a placeholder accessibility statement. A full audit and conformance declaration will be provided by the institution’s accessibility team.',
    // French accessibility
    accessibilityStatement: 'Déclaration d’accessibilité',
    ourCommitment: 'Notre engagement',
    commitmentText: 'L’Alliance NovaCampus s’engage à rendre ses services numériques accessibles à tous, y compris aux personnes en situation de handicap. Nous visons à nous conformer aux directives WCAG 2.2 niveau AA et au RGAA (Référentiel Général d’Amélioration de l’Accessibilité).',
    currentFeatures: 'Fonctionnalités d’accessibilité actuelles',
    featureThemes: 'Prise en charge complète des thèmes clair, sombre et haut contraste (préférence persistante, détection système)',
    featureContrast: 'Le mode haut contraste utilise des calculs de luminance pour une lisibilité correcte (jamais de paires faible contraste comme blanc sur jaune)',
    featureKeyboard: 'Navigation au clavier et gestion du focus accessibles',
    featureLabels: 'Libellés de formulaire appropriés, attributs ARIA et HTML sémantique',
    featureResponsive: 'Redimensionnement du texte et design responsive',
    featureErrors: 'Messages d’erreur clairs et avis de confidentialité',
    limitations: 'Limites et travaux en cours',
    limitationsText: 'Cette plateforme est en développement actif. Certaines parties de l’interface (tableaux de bord, tableaux complexes, intégrations tierces) ne sont pas encore entièrement accessibles. Nous améliorons continuellement sur la base des tests et retours.',
    feedback: 'Retours et contact',
    feedbackText: 'Si vous rencontrez des obstacles d’accessibilité ou avez des suggestions, veuillez nous contacter via l’e-mail de support ou le lien de contact dans le pied de page. Nous visons à répondre aux retours d’accessibilité sous 5 jours ouvrés.',
    placeholderAccessibility: 'Ceci est une déclaration d’accessibilité placeholder. Un audit complet et une déclaration de conformité seront fournis par l’équipe accessibilité de l’établissement.',
    // 404 page (French)
    pageNotFound: 'Page non trouvée',
    pageNotFoundDesc: 'Désolé, la page que vous recherchez n\'existe pas ou a été déplacée.',
    backToLogin: 'Retour à la connexion',
    returnHome: 'Retour à l\'accueil',
    contactSupport: 'Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter le support de votre campus.',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  // Apply language to <html lang="...">
  const applyLanguage = (newLang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  // Load saved language or browser preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('language');
    let initialLang = 'en';

    if (saved && LANGUAGES.includes(saved)) {
      initialLang = saved;
    } else {
      // Try to detect from browser
      const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      if (browserLang.startsWith('fr')) {
        initialLang = 'fr';
      }
    }

    setLanguageState(initialLang);
    applyLanguage(initialLang);
  }, []);

  const setLanguage = (newLang) => {
    if (!LANGUAGES.includes(newLang)) return;

    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
    applyLanguage(newLang);
  };

  const toggleLanguage = () => {
    const currentIndex = LANGUAGES.indexOf(language);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    setLanguage(LANGUAGES[nextIndex]);
  };

  // Simple translation function
  const t = (key) => {
    const langTranslations = translations[language] || translations.en;
    return langTranslations[key] || translations.en[key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isFrench: language === 'fr',
    isEnglish: language === 'en',
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

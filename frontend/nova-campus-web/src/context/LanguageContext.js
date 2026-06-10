'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const LANGUAGES = ['en', 'fr'];

// Simple bilingual translations.
// Keys are used via translate('key').
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
    // Profile menu (used by ProfileMenu component)
    myDashboard: 'My Dashboard',
    settings: 'Settings',
    logout: 'Logout',
    // Role-specific menu items (derived from Deliverable1 mockups/sidebars, no Privacy/Accessibility)
    schedule: 'Schedule',
    grades: 'Grades & Evaluations',
    absences: 'Absences',
    academicHistory: 'Academic History',
    payments: 'Payments',
    myCourses: 'My Courses',
    gradeEntry: 'Grade Entry',
    attendance: 'Attendance & Absences',
    roomReservations: 'Room Reservations',
    studentHistory: 'Student History',
    studentsEnrollments: 'Students & Enrollments',
    planningConflicts: 'Planning & Conflicts',
    paymentsScolarite: 'Payments & Tuition',
    campusIndicators: 'Campus Indicators',
    programIndicators: 'Program Indicators',
    strategicReports: 'Strategic Reports',
    campusComparison: 'Campus Comparison',
    // Admin dashboard
    adminDashboardTitle: 'Overview',
    adminDashboardSubtitle: 'Campus overview and key indicators',
    kpiEnrolledStudents: 'ENROLLED STUDENTS',
    kpiRoomOccupancy: 'ROOM OCCUPANCY RATE',
    kpiOverduePayments: 'OVERDUE PAYMENTS',
    kpiSuccessRate: 'SUCCESS RATE',
    campusProgramsTitle: 'Campus programs',
    noActiveEnrollments: 'No active enrollments.',
    revenueBySemesterTitle: 'Revenue by semester',
    noPaymentData: 'No payment data yet.',
    paymentsToProcessTitle: 'Payments to process',
    noOverduePayments: 'No outstanding payments.',
    colStudent: 'Student',
    colDueDate: 'Due date',
    colAmount: 'Amount',
    colDelay: 'Delay',
    colStatus: 'Status',
    daysSuffix: 'd',
    // Admin students page
    adminStudentsTitle: 'Students & Enrollments',
    studentsOutOf: 'students out of',
    searchStudentsPlaceholder: 'Search (name, ID, email)',
    allPrograms: 'All programs',
    allStatuses: 'All statuses',
    statusActive: 'Active',
    statusSuspended: 'Suspended',
    statusGraduated: 'Graduated',
    statusWithdrawn: 'Withdrawn',
    noStudentsMatch: 'No students match the selected criteria.',
    colId: 'ID',
    colProgram: 'Program',
    colEntryYear: 'Entry year',
    colPayment: 'Payment',
    paymentUpToDate: 'Up to date',
    paymentDelay: 'Delay',
    // Admin planning page
    adminPlanningTitle: 'Planning & Conflicts',
    scheduledCourses: 'scheduled courses',
    conflictsDetected: 'conflict(s) detected',
    conflictsTitle: 'Conflicts detected',
    noConflicts: 'No room or instructor conflicts.',
    roomConflict: 'Room conflict',
    instructorConflict: 'Instructor conflict',
    andLabel: 'and',
    campusRoomsTitle: 'Campus rooms',
    noRooms: 'No rooms registered.',
    seatsLabel: 'seats',
    noCoursesPlanned: 'No courses scheduled for this campus.',
    dayMon: 'MON',
    dayTue: 'TUE',
    dayWed: 'WED',
    dayThu: 'THU',
    dayFri: 'FRI',
    // Admin finance page
    adminFinanceTitle: 'Billing',
    adminFinanceSubtitle: 'Payments & dunning',
    kpiInvoiced: 'INVOICED',
    kpiCollected: 'COLLECTED',
    kpiPending: 'OUTSTANDING',
    kpiAvgRecovery: 'AVERAGE RECOVERY TIME',
    filterAll: 'All',
    filterPaid: 'Paid',
    searchInvoicesPlaceholder: 'Search (student, invoice no.)',
    noInvoicesMatch: 'No invoices match the selected criteria.',
    colInvoiceNumber: 'No.',
    // Sidebar sections and additional mockup items (from Deliverable 1 mockups - Student/Teacher/Admin/Executive dashboards)
    studentSpace: 'Student Space',
    teacherSpace: 'Teacher Space',
    adminSpace: 'Campus Oversight',
    executiveSpace: 'Executive Direction',
    tools: 'Tools',
    assistantAria: 'Aria Assistant (AI)',
    profile: 'Profile',
    notifications: 'Notifications',
    helpCenter: 'Help Center',
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
    // Profile menu (used by ProfileMenu component)
    myDashboard: 'Mon tableau de bord',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    // Role-specific menu items (derived from Deliverable1 mockups/sidebars, no Privacy/Accessibility)
    schedule: 'Emploi du temps',
    grades: 'Notes & Évaluations',
    absences: 'Absences',
    academicHistory: 'Historique académique',
    payments: 'Paiements',
    myCourses: 'Mes cours',
    gradeEntry: 'Saisie des notes',
    attendance: 'Présences & absences',
    roomReservations: 'Réservation de salles',
    studentHistory: 'Historique étudiants',
    studentsEnrollments: 'Étudiants & inscriptions',
    planningConflicts: 'Planning & conflits',
    paymentsScolarite: 'Paiements & scolarité',
    campusIndicators: 'Indicateurs par campus',
    programIndicators: 'Indicateurs par programme',
    strategicReports: 'Rapports stratégiques',
    campusComparison: 'Comparatif campus',
    // Admin dashboard
    adminDashboardTitle: 'Pilotage',
    adminDashboardSubtitle: 'Vue d\'ensemble du campus et indicateurs clés',
    kpiEnrolledStudents: 'ÉTUDIANTS INSCRITS',
    kpiRoomOccupancy: 'TAUX DE REMPLISSAGE DES SALLES',
    kpiOverduePayments: 'IMPAYÉS',
    kpiSuccessRate: 'TAUX DE RÉUSSITE',
    campusProgramsTitle: 'Programmes du campus',
    noActiveEnrollments: 'Aucune inscription active.',
    revenueBySemesterTitle: 'Encaissements par semestre',
    noPaymentData: 'Pas encore de données de paiement.',
    paymentsToProcessTitle: 'Paiements à traiter',
    noOverduePayments: 'Aucun impayé en cours.',
    colStudent: 'Étudiant',
    colDueDate: 'Échéance',
    colAmount: 'Montant',
    colDelay: 'Retard',
    colStatus: 'Statut',
    daysSuffix: 'j',
    // Admin students page
    adminStudentsTitle: 'Étudiants & inscriptions',
    studentsOutOf: 'étudiants sur',
    searchStudentsPlaceholder: 'Rechercher (nom, ID, email)',
    allPrograms: 'Tous les programmes',
    allStatuses: 'Tous les statuts',
    statusActive: 'Actif',
    statusSuspended: 'Suspendu',
    statusGraduated: 'Diplômé',
    statusWithdrawn: 'Abandon',
    noStudentsMatch: 'Aucun étudiant ne correspond aux critères.',
    colId: 'ID',
    colProgram: 'Programme',
    colEntryYear: 'Entrée',
    colPayment: 'Paiement',
    paymentUpToDate: 'À jour',
    paymentDelay: 'Retard',
    // Admin planning page
    adminPlanningTitle: 'Planning & conflits',
    scheduledCourses: 'cours planifiés',
    conflictsDetected: 'conflit(s) détecté(s)',
    conflictsTitle: 'Conflits détectés',
    noConflicts: 'Aucun conflit de salle ou d\'intervenant.',
    roomConflict: 'Conflit de salle',
    instructorConflict: 'Conflit d\'intervenant',
    andLabel: 'et',
    campusRoomsTitle: 'Salles du campus',
    noRooms: 'Aucune salle enregistrée.',
    seatsLabel: 'places',
    noCoursesPlanned: 'Aucun cours planifié pour ce campus.',
    dayMon: 'LUN',
    dayTue: 'MAR',
    dayWed: 'MER',
    dayThu: 'JEU',
    dayFri: 'VEN',
    // Admin finance page
    adminFinanceTitle: 'Facturation',
    adminFinanceSubtitle: 'Paiements & relances',
    kpiInvoiced: 'FACTURÉ',
    kpiCollected: 'ENCAISSÉ',
    kpiPending: 'EN ATTENTE',
    kpiAvgRecovery: 'DÉLAI MOYEN DE RECOUVREMENT',
    filterAll: 'Toutes',
    filterPaid: 'Payées',
    searchInvoicesPlaceholder: 'Rechercher (étudiant, n° facture)',
    noInvoicesMatch: 'Aucune facture ne correspond aux critères.',
    colInvoiceNumber: 'N°',
    // Sidebar sections and additional mockup items (from Deliverable 1 mockups - Student/Teacher/Admin/Executive dashboards)
    studentSpace: 'Espace étudiant',
    teacherSpace: 'Espace enseignant',
    adminSpace: 'Pilotage campus',
    executiveSpace: 'Direction générale',
    tools: 'Outils',
    assistantAria: 'Assistant Aria (IA)',
    profile: 'Profil',
    notifications: 'Notifications',
    helpCenter: 'Centre d\'aide',
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
    // Help page
    helpCenter: 'Help Center',
    helpDescription: 'Need assistance? Find answers to frequently asked questions and learn how to use the NovaCampus platform.',
    gettingStarted: 'Getting Started',
    gettingStartedDesc: 'New to NovaCampus? Learn how to navigate your dashboard and access your academic information.',
    faq: 'Frequently Asked Questions',
    faqDesc: 'Find answers to common questions about schedules, grades, payments, and more.',
    technicalSupport: 'Technical Support',
    technicalSupportDesc: 'Encountering an issue? Contact our support team for assistance.',
    contactInfo: 'Contact Information',
    supportEmail: 'Support Email',
    // Help page
    toAccess: 'to access your dashboard',
    navigateDashboard: 'Navigate your dashboard to view your schedule, grades, and more',
    viewAcademicInfo: 'View your academic information including courses and attendance',
    howViewGrades: 'How do I view my grades?',
    howViewGradesAnswer: 'Go to the Grades & Evaluations section in your dashboard to see all your current and past grades.',
    howViewSchedule: 'How do I view my class schedule?',
    howViewScheduleAnswer: 'Your weekly schedule is available in the Schedule section. You can switch between week, day, and month views.',
    howMakePayment: 'How do I make a payment?',
    howMakePaymentAnswer: 'Navigate to the Payments section to view your outstanding balance and make payments online.',
    // Help page (French)
    helpCenter: 'Centre d\'aide',
    helpDescription: 'Besoin d\'aide ? Trouvez des réponses aux questions fréquemment posées et apprenez à utiliser la plateforme NovaCampus.',
    gettingStarted: 'Pour commencer',
    gettingStartedDesc: 'Nouveau sur NovaCampus ? Apprenez à naviguer dans votre tableau de bord et à accéder à vos informations académiques.',
    toAccess: 'pour accéder à votre tableau de bord',
    navigateDashboard: 'Naviguez dans votre tableau de bord pour consulter votre emploi du temps, vos notes, etc.',
    viewAcademicInfo: 'Consultez vos informations académiques y compris les cours et les présences',
    faq: 'Questions fréquemment posées',
    faqDesc: 'Trouvez des réponses aux questions courantes sur les emplois du temps, les notes, les paiements, etc.',
    howViewGrades: 'Comment consulter mes notes ?',
    howViewGradesAnswer: 'Rendez-vous dans la section Notes & Évaluations de votre tableau de bord pour voir toutes vos notes actuelles et passées.',
    howViewSchedule: 'Comment consulter mon emploi du temps ?',
    howViewScheduleAnswer: 'Votre emploi du temps hebdomadaire est disponible dans la section Emploi du temps. Vous pouvez basculer entre les vues semaine, jour et mois.',
    howMakePayment: 'Comment effectuer un paiement ?',
    howMakePaymentAnswer: 'Accédez à la section Paiements pour consulter votre solde restant dû et effectuer des paiements en ligne.',
    technicalSupport: 'Support technique',
    technicalSupportDesc: 'Vous rencontrez un problème ? Contactez notre équipe de support pour obtenir de l\'aide.',
    contactInfo: 'Informations de contact',
    supportEmail: 'Email de support',
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
  const translate = (key) => {
    const langTranslations = translations[language] || translations.en;
    return langTranslations[key] || translations.en[key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    translate,
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

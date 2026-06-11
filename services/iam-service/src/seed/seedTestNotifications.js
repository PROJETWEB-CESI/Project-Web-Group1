const { isTestCredentialsEnabled } = require('./seedTestUsers');
const User = require('../models/User');
const Notification = require('../notifications/notification.model');

async function seedTestNotificationsIfEnabled() {
  if (!isTestCredentialsEnabled()) return;

  const student = await User.findOne({ where: { email: 'student@test.com' } });
  if (!student) return;

  const now = Date.now();
  const ago = (ms) => new Date(now - ms);
  const MIN = 60 * 1000;
  const H   = 60 * MIN;
  const D   = 24 * H;

  const samples = [
    {
      type: 'timetable',
      title:   "Introduction au Business du lundi 4 déc. — salle modifiée",
      titleEn: "Intro to Business Monday Dec. 4 — room changed",
      body:    "Le cours est déplacé de B-204 à l'Amphi Commerce A. Pensez à mettre à jour votre itinéraire.",
      bodyEn:  "The course has been moved from B-204 to Amphi Commerce A. Please update your schedule.",
      source: 'Service scolarité',
      read: false,
      createdAt: ago(12 * MIN),
    },
    {
      type: 'deadline',
      title:   'Examen Économie Internationale dans 7 jours',
      titleEn: 'International Economics exam in 7 days',
      body:    'DST le 11 décembre à 09h00. Souhaitez-vous une fiche de révision ciblée ?',
      bodyEn:  'Written test on December 11 at 09:00. Would you like a targeted revision sheet?',
      source: 'Aria · automatisé',
      read: false,
      createdAt: ago(1 * H),
    },
    {
      type: 'absence',
      title:   "Justificatif accepté — absence du 4 nov.",
      titleEn: "Justification accepted — absence on Nov. 4",
      body:    "Votre certificat médical pour l'absence en Économie Internationale a été validé.",
      bodyEn:  "Your medical certificate for the absence in International Economics has been validated.",
      source: 'Service scolarité',
      read: false,
      createdAt: ago(2 * D),
    },
    {
      type: 'announcement',
      title:   'Fermeture exceptionnelle du campus — 21 déc.',
      titleEn: 'Exceptional campus closure — Dec. 21',
      body:    'Le campus sera fermé pour les vacances de Noël. Reprise des cours le 8 janvier 2024.',
      bodyEn:  'The campus will be closed for the Christmas holidays. Classes resume on January 8, 2024.',
      source: 'Direction Paris Center',
      read: false,
      createdAt: ago(3 * D),
    },
    {
      type: 'grade',
      title:   'Note Quiz 1 — Introduction au Business',
      titleEn: 'Grade Quiz 1 — Introduction to Business',
      body:    'Votre note pour le Quiz 1 du 12 octobre est désormais disponible : 15 / 20.',
      bodyEn:  'Your grade for Quiz 1 on October 12 is now available: 15 / 20.',
      source: 'Prof. Jean Mercier',
      read: false,
      createdAt: ago(4 * D),
    },
    {
      type: 'deadline',
      title:   'Inscriptions S2 — ouverture le 8 janvier 2024',
      titleEn: 'S2 Enrollments — opening January 8, 2024',
      body:    'Choix des options à valider avant le 22 janvier. Les places en Marketing Stratégique sont limitées.',
      bodyEn:  'Option choices must be confirmed before January 22. Spots in Strategic Marketing are limited.',
      source: 'Service scolarité',
      read: false,
      createdAt: ago(5 * D),
    },
  ];

  await Notification.destroy({ where: { userId: student.id } });
  for (const n of samples) {
    await Notification.create({ ...n, userId: student.id });
  }
  console.log('[DEV] Seeded demo notifications for student@test.com (6 entries, all unread)');
}

module.exports = { seedTestNotificationsIfEnabled };

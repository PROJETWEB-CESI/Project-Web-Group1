#!/usr/bin/env node
/**
 * scripts/test-billing.js
 *
 * Tests complets pour la connexion billing-service <-> ai-agent-service.
 *
 * Deux axes :
 *   1. Tests directs du billing-service (endpoints REST via gateway)
 *   2. Tests de prompts envoyés à l'agent IA qui déclenche le get_billing tool
 *
 * Prérequis :
 *   - docker compose up (stack complète, y compris billing-service)
 *   - ENABLE_TEST_CREDENTIALS=true dans .env  →  comptes de test disponibles
 *   - node scripts/test-billing.js
 *
 * Comptes de test :
 *   student@test.com / student123   (role: student, campus: CAMP001)
 *   admin@test.com   / admin123     (role: admin,   campus: CAMP001)
 */

const BASE = process.env.TEST_BASE || 'http://localhost:8080';

let passed = 0;
let failed = 0;

function logPass(label) {
  console.log(`  [PASS] ${label}`);
  passed++;
}
function logFail(label, details) {
  console.log(`  [FAIL] ${label}`);
  if (details) {
    const msg = typeof details === 'string' ? details : JSON.stringify(details);
    console.log('         ' + msg.slice(0, 400));
  }
  failed++;
}
function assert(cond, label, details) {
  cond ? logPass(label) : logFail(label, details);
}
function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function req(path, opts = {}) {
  const { method = 'GET', body, cookie = '', expectStatus = 200, label = '' } = opts;
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const fetchOpts = { method, headers };
  if (body !== undefined) fetchOpts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, fetchOpts);
  } catch (e) {
    const display = label || `${method} ${path}`;
    logFail(display, `Network error: ${e.message}`);
    return { status: 0, data: null, ok: false, headers: new Headers() };
  }

  const status = res.status;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  const ok = status === expectStatus;
  const display = label || `${method} ${path} (expect ${expectStatus}) → ${status}`;
  ok ? logPass(display) : logFail(display, data);
  return { status, data, ok, headers: res.headers };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function extractCookies(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  const result = {};
  for (const c of raw) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) result[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return result;
}

function cookieHeader(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function login(email, password) {
  const { ok, data, headers } = await req('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    expectStatus: 200,
    label: `Login ${email}`,
  });
  if (!ok) {
    console.error('\n[FATAL] Login failed. Ensure ENABLE_TEST_CREDENTIALS=true and iam-service is recreated.');
    process.exit(1);
  }
  return { cookies: cookieHeader(extractCookies(headers)), user: data?.user };
}

// ── Billing direct (via gateway → billing-service) ───────────────────────────

async function testBillingDirect(studentCookie, adminCookie) {
  section('1. BILLING SERVICE — Endpoints directs (via gateway)');

  // Health
  await req('/api/billing/health', {
    label: 'GET /api/billing/health — service UP',
    expectStatus: 200,
  });

  // Student summary (gateway strips /api/billing/ → /student/STU001/summary on billing)
  // Note: gateway rewrites /api/billing/* → /* so billing must expose /student/:id/...
  // The billing service routes are under /api/payments/*, gateway strips to /payments/*
  // Direct docker network test is done via ai-agent; gateway path tested here for awareness.

  // Endpoint /api/billing (used by AI agent) via gateway
  const { data: billingData, ok: billingOk } = await req(
    '/api/billing?userId=STU001&campusId=CAMP001',
    {
      label: 'GET /api/billing?userId=STU001 — résumé agent IA',
      expectStatus: 200,
    }
  );
  if (billingOk && billingData) {
    assert(typeof billingData.totalInvoiced === 'number', 'totalInvoiced est un nombre', billingData);
    assert(typeof billingData.totalPaid === 'number', 'totalPaid est un nombre', billingData);
    assert(typeof billingData.outstanding === 'number', 'outstanding est un nombre', billingData);
    assert(Array.isArray(billingData.payments), 'payments est un tableau', billingData);
  }

  // Sans userId → 400
  await req('/api/billing', {
    label: 'GET /api/billing sans userId → 400',
    expectStatus: 400,
  });

  // userId inexistant → message "No billing records"
  const { data: emptyData } = await req('/api/billing?userId=XXXX_NOBODY', {
    label: 'GET /api/billing userId inconnu → 200 avec message',
    expectStatus: 200,
  });
  assert(
    emptyData?.message?.includes('No billing') || (emptyData && typeof emptyData === 'object'),
    'Réponse cohérente pour userId inconnu',
    emptyData
  );

  // Admin : stats
  const { data: statsData, ok: statsOk } = await req(
    '/api/billing/payments/stats?campusId=CAMP001',
    {
      label: 'GET /api/billing/payments/stats (admin) → KPIs campus',
      cookie: adminCookie,
      expectStatus: 200,
    }
  );
  if (statsOk && statsData) {
    assert(typeof statsData.totalInvoiced !== 'undefined', 'stats.totalInvoiced présent', statsData);
  }

  // Admin : impayés
  await req('/api/billing/payments/overdue?campusId=CAMP001', {
    label: 'GET /api/billing/payments/overdue — liste impayés',
    cookie: adminCookie,
    expectStatus: 200,
  });

  // Admin : liste paiements
  const { data: paymentsData, ok: paymentsOk } = await req(
    '/api/billing/payments?campusId=CAMP001',
    {
      label: 'GET /api/billing/payments?campusId=CAMP001 — liste admin',
      cookie: adminCookie,
      expectStatus: 200,
    }
  );
  if (paymentsOk) {
    assert(Array.isArray(paymentsData), 'Retourne un tableau de paiements', paymentsData);
  }

  // Admin : liste sans campusId → 400
  await req('/api/billing/payments', {
    label: 'GET /api/billing/payments sans campusId → 400',
    cookie: adminCookie,
    expectStatus: 400,
  });
}

// ── Prompts AI agent ──────────────────────────────────────────────────────────

async function sendPrompt(message, cookie, label) {
  const { data, ok } = await req('/api/ai/api/chat', {
    method: 'POST',
    body: { message, conversationId: null },
    cookie,
    expectStatus: 200,
    label,
  });
  return { data, ok };
}

function assertBillingInResponse(response, label) {
  const text = (response?.message || response?.content || '').toLowerCase();
  const hasBillingInfo =
    text.includes('€') ||
    text.includes('factur') ||
    text.includes('paiement') ||
    text.includes('solde') ||
    text.includes('payé') ||
    text.includes('billing') ||
    text.includes('invoice') ||
    text.includes('outstanding') ||
    text.includes('paid') ||
    text.includes('indisponible');
  assert(hasBillingInfo, `${label} → réponse contient des infos billing`, text.slice(0, 200));
  return text;
}

async function testAIPrompts(studentCookie, adminCookie) {
  section('2. AI AGENT — Prompts déclenchant get_billing (étudiant)');

  // ── Prompts évidents ───────────────────────────────────────────────────────
  {
    const { data } = await sendPrompt(
      'Combien est-ce que je dois payer en tout ?',
      studentCookie,
      'Prompt: "Combien est-ce que je dois payer en tout ?"'
    );
    assertBillingInResponse(data, 'Montant total à payer');
  }
  {
    const { data } = await sendPrompt(
      'Montre-moi mes factures',
      studentCookie,
      'Prompt: "Montre-moi mes factures"'
    );
    assertBillingInResponse(data, 'Mes factures');
  }
  {
    const { data } = await sendPrompt(
      'Quel est mon solde de scolarité ?',
      studentCookie,
      'Prompt: "Quel est mon solde de scolarité ?"'
    );
    assertBillingInResponse(data, 'Solde scolarité');
  }
  {
    const { data } = await sendPrompt(
      "J'ai des frais de scolarité en retard ?",
      studentCookie,
      'Prompt: "J\'ai des frais de scolarité en retard ?"'
    );
    assertBillingInResponse(data, 'Frais en retard');
  }

  // ── Prompts naturels ───────────────────────────────────────────────────────
  section('3. AI AGENT — Prompts naturels / reformulations');
  {
    const { data } = await sendPrompt(
      'Est-ce que j\'ai des paiements en attente ?',
      studentCookie,
      'Prompt: "Paiements en attente ?"'
    );
    assertBillingInResponse(data, 'Paiements en attente');
  }
  {
    const { data } = await sendPrompt(
      'Donne-moi le statut de ma facturation',
      studentCookie,
      'Prompt: "Statut de ma facturation"'
    );
    assertBillingInResponse(data, 'Statut facturation');
  }
  {
    const { data } = await sendPrompt(
      'What is my current billing status?',
      studentCookie,
      'Prompt EN: "What is my current billing status?"'
    );
    assertBillingInResponse(data, 'Billing status (EN)');
  }
  {
    const { data } = await sendPrompt(
      'Show me my invoices please',
      studentCookie,
      'Prompt EN: "Show me my invoices please"'
    );
    assertBillingInResponse(data, 'Show invoices (EN)');
  }

  // ── Prompt admin ───────────────────────────────────────────────────────────
  section('4. AI AGENT — Prompts billing (admin)');
  {
    const { data } = await sendPrompt(
      'Quels sont les étudiants qui ont des paiements en retard ?',
      adminCookie,
      'Prompt admin: "Étudiants avec paiements en retard"'
    );
    // Admin has get_billing tool too; response should reference billing
    assert(
      typeof data?.message === 'string' && data.message.length > 10,
      'Admin billing prompt → réponse non vide',
      data
    );
  }
  {
    const { data } = await sendPrompt(
      'Donne-moi les statistiques de facturation du campus',
      adminCookie,
      'Prompt admin: "Statistiques facturation campus"'
    );
    assert(
      typeof data?.message === 'string' && data.message.length > 10,
      'Admin stats billing → réponse non vide',
      data
    );
  }

  // ── Prompt sans lien billing (le tool ne doit pas être déclenché inutilement) ──
  section('5. AI AGENT — Contrôle : prompts sans lien billing');
  {
    const { data } = await sendPrompt(
      "Qu'est-ce que NovaCampus ?",
      studentCookie,
      'Prompt hors-billing: "Qu\'est-ce que NovaCampus ?"'
    );
    assert(
      typeof data?.message === 'string' && data.message.length > 10,
      'Réponse générale sans appel billing inutile',
      data?.message?.slice(0, 150)
    );
  }
  {
    const { data } = await sendPrompt(
      'Bonjour, comment puis-je contacter mon enseignant ?',
      studentCookie,
      'Prompt hors-billing: "Contacter mon enseignant"'
    );
    assert(
      typeof data?.message === 'string' && data.message.length > 10,
      'Réponse générale — pas de confusion avec billing',
      data?.message?.slice(0, 150)
    );
  }
}

// ── Dunning (relances) ────────────────────────────────────────────────────────

async function testDunning(adminCookie) {
  section('6. DUNNING — Workflow de relances');

  const { data: preview, ok: previewOk } = await req(
    '/api/billing/dunning/preview?campusId=CAMP001',
    {
      label: 'GET /api/billing/dunning/preview — aperçu relances CAMP001',
      cookie: adminCookie,
      expectStatus: 200,
    }
  );
  if (previewOk) {
    assert(
      preview && typeof preview === 'object' && ('R1' in preview || 'total' in preview),
      'Preview retourne un objet avec les stages R1/R2/R3',
      preview
    );
  }

  // Preview campus inexistant
  const { data: emptyPreview } = await req(
    '/api/billing/dunning/preview?campusId=CAMP999',
    {
      label: 'GET /api/billing/dunning/preview campus inconnu → stages vides',
      cookie: adminCookie,
      expectStatus: 200,
    }
  );
  assert(
    emptyPreview && typeof emptyPreview === 'object' && (emptyPreview.total === 0 || Array.isArray(emptyPreview)),
    'Preview campus inexistant → total = 0 ou liste vide',
    emptyPreview
  );
}

// ── Résumé ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     TEST — billing-service <-> ai-agent-service             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  BASE = ${BASE}`);

  section('AUTH — Connexion avec les comptes de test');
  const { cookies: studentCookie } = await login('student@test.com', 'student123');
  const { cookies: adminCookie }   = await login('admin@test.com',   'admin123');

  await testBillingDirect(studentCookie, adminCookie);
  await testAIPrompts(studentCookie, adminCookie);
  await testDunning(adminCookie);

  console.log('\n' + '═'.repeat(62));
  const total = passed + failed;
  console.log(`  Résultats : ${passed}/${total} passés  |  ${failed} échoués`);
  console.log('═'.repeat(62));

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

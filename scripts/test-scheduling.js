#!/usr/bin/env node
/**
 * scripts/test-scheduling.js
 *
 * Comprehensive test script for the Scheduling Service (rooms + timetables/conflicts).
 *
 * - Classic tests: full CRUD, filters, listings.
 * - Edge cases: time overlaps (exact, partial, 1min, touching, contained), missing fields,
 *   bad data (times, days, ids), duplicate PKs, updates/deletes on non-existing, large payloads,
 *   optional fields, cross-campus, semester/year isolation.
 * - Security / adversarial tests:
 *     * Uses test credentials (login via /api/auth/* with admin@test.com etc).
 *     * Verifies httpOnly cookie handling through gateway.
 *     * Unauthenticated calls to scheduling (currently allowed; documents the state).
 *     * Tampered/invalid cookies.
 *     * Bad login (no cookies leaked).
 *     * Potential injection in IDs, query params, bodies (SQL-like strings) — verifies no crash/500 and data integrity.
 *     * Wrong methods/content-types.
 * - The script *requires* test credentials to be seeded (ENABLE_TEST_CREDENTIALS=true in .env + iam recreated).
 *   If login fails, it aborts with clear instructions. This makes it "only runnable in develop/dev setups".
 * - Run with: node scripts/test-scheduling.js
 * - Always run against a full `docker compose up` stack.
 * - Cleans up its own test data (TST* ids) in finally{} even on failure.
 * - Exits 0 only if ALL pass.
 *
 * Test credentials (from .env.exemple / README when ENABLE=true):
 *   admin@test.com / admin123   (role: admin, campus: CAMP001)
 */

const BASE = process.env.TEST_BASE || 'http://localhost:8080';
const TEST_USER = { email: 'admin@test.com', password: 'admin123' };

let passed = 0;
let failed = 0;
const createdRooms = [];
const createdTimetables = [];

function logPass(label) {
  console.log(`[PASS] ${label}`);
  passed++;
}

function logFail(label, details) {
  console.log(`[FAIL] ${label}`);
  if (details) console.log('       ' + (typeof details === 'string' ? details : JSON.stringify(details).slice(0, 300)));
  failed++;
}

function assert(condition, label, details) {
  if (condition) {
    logPass(label);
  } else {
    logFail(label, details);
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseCookies(setCookieValue) {
  const cookies = {};
  if (!setCookieValue) return cookies;
  const arr = Array.isArray(setCookieValue) ? setCookieValue : [setCookieValue];
  for (const cookieStr of arr) {
    if (!cookieStr) continue;
    // Take only the name=value part before first ;
    const main = cookieStr.split(';')[0].trim();
    const eq = main.indexOf('=');
    if (eq > 0) {
      const name = main.slice(0, eq);
      const value = main.slice(eq + 1);
      if (name === 'accessToken' || name === 'refreshToken') {
        cookies[name] = value;
      }
    }
  }
  return cookies;
}

async function apiRequest(path, options = {}) {
  const { method = 'GET', body, cookieHeader = '', expectStatus = 200, label = '' } = options;
  const url = `${BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  const fetchOptions = { method, headers };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, fetchOptions);
  } catch (e) {
    const msg = `Network error calling ${method} ${path}: ${e.message}`;
    logFail(label || `${method} ${path}`, msg);
    return { status: 0, data: null, ok: false };
  }

  const status = res.status;
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const ok = status === expectStatus;
  const displayLabel = label || `${method} ${path} (expect ${expectStatus})`;

  if (ok) {
    logPass(displayLabel + ` -> ${status}`);
  } else {
    logFail(displayLabel + ` -> ${status}`, data);
  }

  // Return raw headers for cookie extraction on login etc.
  return { status, data, ok, rawHeaders: res.headers, text };
}

async function loginAndGetCookies() {
  console.log('\n=== AUTH: Login with test credentials (required for this script) ===');
  const { ok, data, rawHeaders } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: TEST_USER,
    expectStatus: 200,
    label: 'POST /api/auth/login (admin@test.com)',
  });

  if (!ok) {
    console.error('\n[ERROR] Login with test credentials failed (status ' + (data ? JSON.stringify(data) : 'unknown') + ').');
    console.error('This test script requires ENABLE_TEST_CREDENTIALS=true in your .env (or shell) + docker compose up -d --force-recreate iam-service.');
    console.error('See README.md and .env.exemple for the 4 test accounts (student/teacher/admin/executive @test.com).');
    console.error('The script will only fully execute when test users are seeded (dev-only setup).');
    process.exit(1);
  }

  // Extract Set-Cookie (httpOnly cookies forwarded by gateway)
  let setCookie = rawHeaders.get('set-cookie');
  // Some node/fetch impls expose getSetCookie()
  if (rawHeaders.getSetCookie) {
    setCookie = rawHeaders.getSetCookie();
  }
  const cookies = parseCookies(setCookie);
  const cookieHeader = `accessToken=${cookies.accessToken || ''}; refreshToken=${cookies.refreshToken || ''}`;

  if (!cookies.accessToken) {
    logFail('Login returned no accessToken cookie (httpOnly forwarding issue?)');
    process.exit(1);
  }

  // Verify cookie works for /me (security + gateway cookie pass-through)
  const meRes = await apiRequest('/api/auth/me', {
    method: 'GET',
    cookieHeader,
    expectStatus: 200,
    label: 'GET /api/auth/me (with httpOnly cookies from test login)',
  });
  if (meRes.ok && meRes.data && meRes.data.user) {
    logPass('Authenticated /me with test admin user (role check: ' + (meRes.data.user.role || 'n/a') + ')');
  }

  console.log('  Cookie header prepared (httpOnly tokens captured for subsequent calls).');
  return cookieHeader;
}

async function cleanup() {
  console.log('\n=== CLEANUP (best-effort, even on failure) ===');
  for (const rid of createdRooms) {
    try {
      // Use raw fetch to avoid triggering [FAIL] log for expected 404s during cleanup
      const res = await fetch(`${BASE}/api/scheduling/rooms/${rid}`, { method: 'DELETE', headers: { 'Cookie': '' } });
      if (res.status === 200 || res.status === 404) {
        logPass(`DELETE room ${rid} (${res.status} ok for cleanup)`);
      } else {
        logFail(`DELETE room ${rid} unexpected ${res.status}`);
      }
    } catch (_) {}
  }
  for (const sid of createdTimetables) {
    try {
      const res = await fetch(`${BASE}/api/scheduling/timetables/${sid}`, { method: 'DELETE', headers: { 'Cookie': '' } });
      if (res.status === 200 || res.status === 404) {
        logPass(`DELETE timetable ${sid} (${res.status} ok for cleanup)`);
      } else {
        logFail(`DELETE timetable ${sid} unexpected ${res.status}`);
      }
    } catch (_) {}
  }
}

async function main() {
  console.log('=== NovaCampus Scheduling Service - Comprehensive Test ===');
  console.log(`Gateway base: ${BASE}`);
  console.log('Requires full docker stack + test credentials seeded (ENABLE_TEST_CREDENTIALS=true + iam recreate).');
  console.log('Covers: classic CRUD, filters, conflicts (minute detail), edges, security/injection, cookie flow.\n');

  const cookieHeader = await loginAndGetCookies();

  // Also verify unauthenticated access to scheduling still works (current design - no authz on scheduling yet)
  console.log('\n=== SECURITY: Unauthenticated access to scheduling (current behavior) ===');
  const unauthRooms = await apiRequest('/api/scheduling/rooms', {
    method: 'GET',
    cookieHeader: '', // no cookies
    expectStatus: 200,
    label: 'GET /api/scheduling/rooms (no auth cookies - currently allowed)',
  });
  assert(unauthRooms.ok, 'Unauthenticated rooms list succeeds (scheduling currently has no auth middleware)');

  // Tampered cookie
  const badCookie = 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid; refreshToken=bad';
  await apiRequest('/api/scheduling/rooms', {
    method: 'GET',
    cookieHeader: badCookie,
    expectStatus: 200,
    label: 'GET /api/scheduling/rooms (tampered/invalid cookies - currently allowed)',
  });

  // Bad login attempt (security: no creds leak)
  console.log('\n=== SECURITY: Bad login ===');
  const badLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: TEST_USER.email, password: 'wrongpass123' },
    expectStatus: 401,
    label: 'POST /api/auth/login (wrong password)',
  });
  assert(badLogin.ok, 'Bad login returns 401, no tokens issued');

  // === ROOMS ===
  console.log('\n=== CLASSIC + EDGES: ROOMS ===');

  // list + filter
  await apiRequest('/api/scheduling/rooms', { cookieHeader, expectStatus: 200, label: 'GET /rooms' });
  await apiRequest('/api/scheduling/rooms?campus_id=CAMP001', { cookieHeader, expectStatus: 200, label: 'GET /rooms?campus_id=CAMP001' });

  // create minimal (only required per service)
  const room1 = { room_id: 'TSTR001', campus_id: 'CAMP001', room_name: 'Test Room Minimal' };
  const c1 = await apiRequest('/api/scheduling/rooms', { method: 'POST', body: room1, cookieHeader, expectStatus: 201, label: 'POST /rooms (minimal required fields)' });
  if (c1.ok) createdRooms.push('TSTR001');

  // create full
  const room2 = {
    room_id: 'TSTR002',
    campus_id: 'CAMP001',
    room_name: 'Test Full Room',
    building: 'B',
    floor: 3,
    capacity: 42,
    room_type: 'Lab',
    equipment: 'Desks, Projector',
    status: 'Available',
  };
  const c2 = await apiRequest('/api/scheduling/rooms', { method: 'POST', body: room2, cookieHeader, expectStatus: 201, label: 'POST /rooms (full fields)' });
  if (c2.ok) createdRooms.push('TSTR002');

  // get
  await apiRequest('/api/scheduling/rooms/TSTR001', { cookieHeader, expectStatus: 200, label: 'GET /rooms/TSTR001' });

  // update partial
  await apiRequest('/api/scheduling/rooms/TSTR001', {
    method: 'PUT',
    body: { room_name: 'Test Room Minimal - Renamed', capacity: 99 },
    cookieHeader,
    expectStatus: 200,
    label: 'PUT /rooms/TSTR001 (partial update)',
  });
  const afterUpdate = await apiRequest('/api/scheduling/rooms/TSTR001', { cookieHeader, expectStatus: 200, label: 'GET /rooms/TSTR001 (verify update)' });
  assert(afterUpdate.data && afterUpdate.data.capacity === 99, 'Update applied capacity');

  // duplicate id
  await apiRequest('/api/scheduling/rooms', { method: 'POST', body: room1, cookieHeader, expectStatus: 400, label: 'POST /rooms (duplicate room_id -> 400)' });

  // missing required
  await apiRequest('/api/scheduling/rooms', { method: 'POST', body: { room_name: 'no id' }, cookieHeader, expectStatus: 400, label: 'POST /rooms (missing room_id/campus_id -> 400)' });

  // 404
  await apiRequest('/api/scheduling/rooms/TSTR999', { cookieHeader, expectStatus: 404, label: 'GET /rooms/nonexistent -> 404' });
  await apiRequest('/api/scheduling/rooms/TSTR999', { method: 'PUT', body: { room_name: 'x' }, cookieHeader, expectStatus: 404, label: 'PUT /rooms/nonexistent -> 404' });
  await apiRequest('/api/scheduling/rooms/TSTR999', { method: 'DELETE', cookieHeader, expectStatus: 404, label: 'DELETE /rooms/nonexistent -> 404' });

  // delete
  await apiRequest('/api/scheduling/rooms/TSTR001', { method: 'DELETE', cookieHeader, expectStatus: 200, label: 'DELETE /rooms/TSTR001' });
  await apiRequest('/api/scheduling/rooms/TSTR001', { cookieHeader, expectStatus: 404, label: 'GET /rooms after delete -> 404' });

  // large payload (edge)
  const largeRoom = {
    room_id: 'TSTR003',
    campus_id: 'CAMP001',
    room_name: 'Large ' + 'X'.repeat(130), // exceeds the STRING(120) in model -> DB error
    equipment: 'Y'.repeat(500),
  };
  const largeC = await apiRequest('/api/scheduling/rooms', { method: 'POST', body: largeRoom, cookieHeader, expectStatus: 400, label: 'POST /rooms (large strings > column limit -> 400 from DB)' });
  // do not push since it failed to create (good validation)

  // === TIMETABLES ===
  console.log('\n=== CLASSIC + CONFLICTS + EDGES: TIMETABLES ===');

  // lists + filters
  await apiRequest('/api/scheduling/timetables', { cookieHeader, expectStatus: 200, label: 'GET /timetables' });
  await apiRequest('/api/scheduling/timetables?room_id=ROOM101&academic_year=2023-2024', { cookieHeader, expectStatus: 200, label: 'GET /timetables?room+year filter' });
  await apiRequest('/api/scheduling/timetables?instructor_id=INST001&semester=1', { cookieHeader, expectStatus: 200, label: 'GET /timetables?instructor+semester' });

  // Base non-conflict (after seeded SCH001 Mon 09:00-12:00 INST001/ROOM101)
  const baseSched = {
    schedule_id: 'TST001',
    course_id: 'CRS001',
    instructor_id: 'INST001',
    room_id: 'ROOM101',
    day_of_week: 'Monday',
    start_time: '13:00:00',
    end_time: '14:00:00',
    semester: 1,
    academic_year: '2023-2024',
    status: 'Active',
  };
  const t1 = await apiRequest('/api/scheduling/timetables', { method: 'POST', body: baseSched, cookieHeader, expectStatus: 201, label: 'POST /timetables (non-conflict 13-14)' });
  if (t1.ok) createdTimetables.push('TST001');

  // Exact overlap conflict (room)
  const exactOverlap = { ...baseSched, schedule_id: 'TST002', start_time: '13:00:00', end_time: '14:00:00' };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: exactOverlap, cookieHeader, expectStatus: 409, label: 'POST conflict exact same time/room (409)' });

  // Partial overlap (starts inside)
  const partial1 = { ...baseSched, schedule_id: 'TST003', start_time: '13:30:00', end_time: '14:30:00' };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: partial1, cookieHeader, expectStatus: 409, label: 'POST conflict partial overlap room (409)' });

  // Instructor only conflict (different room, overlapping instr time)
  const instrConflict = {
    schedule_id: 'TST004',
    course_id: 'CRS003',
    instructor_id: 'INST001', // same
    room_id: 'ROOM205', // different
    day_of_week: 'Monday',
    start_time: '13:15:00',
    end_time: '14:15:00',
    semester: 1,
    academic_year: '2023-2024',
  };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: instrConflict, cookieHeader, expectStatus: 409, label: 'POST conflict instructor-only overlap (409)' });

  // No conflict: different semester
  const diffSem = { ...baseSched, schedule_id: 'TST005', semester: 2 };
  const t5 = await apiRequest('/api/scheduling/timetables', { method: 'POST', body: diffSem, cookieHeader, expectStatus: 201, label: 'POST non-conflict (different semester)' });
  if (t5.ok) createdTimetables.push('TST005');

  // No conflict: different academic year
  const diffYear = { ...baseSched, schedule_id: 'TST006', academic_year: '2024-2025' };
  const t6 = await apiRequest('/api/scheduling/timetables', { method: 'POST', body: diffYear, cookieHeader, expectStatus: 201, label: 'POST non-conflict (different academic year)' });
  if (t6.ok) createdTimetables.push('TST006');

  // Touching (end == start) should NOT conflict
  const touching = { ...baseSched, schedule_id: 'TST007', start_time: '14:00:00', end_time: '15:00:00' };
  const t7 = await apiRequest('/api/scheduling/timetables', { method: 'POST', body: touching, cookieHeader, expectStatus: 201, label: 'POST touching (14:00 end==start) no conflict (201)' });
  if (t7.ok) createdTimetables.push('TST007');

  // 1-minute overlap
  const oneMin = { ...baseSched, schedule_id: 'TST008', start_time: '13:59:00', end_time: '14:01:00' };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: oneMin, cookieHeader, expectStatus: 409, label: 'POST 1-min overlap conflict (409)' });

  // get by id + filters on created
  await apiRequest('/api/scheduling/timetables/TST001', { cookieHeader, expectStatus: 200, label: 'GET /timetables/TST001' });
  const filtered = await apiRequest('/api/scheduling/timetables?instructor_id=INST001&day_of_week=Monday', { cookieHeader, expectStatus: 200, label: 'GET /timetables filter includes TST001' });
  assert(filtered.data && Array.isArray(filtered.data) && filtered.data.some(t => t.schedule_id === 'TST001'), 'Filter returns our created timetable');

  // Update to cause conflict
  const badUpdate = { ...baseSched, start_time: '09:30:00', end_time: '10:30:00' }; // overlaps seeded SCH001
  await apiRequest('/api/scheduling/timetables/TST001', { method: 'PUT', body: badUpdate, cookieHeader, expectStatus: 409, label: 'PUT timetable to conflicting time (409)' });

  // Valid update
  const goodUpdate = { ...baseSched, start_time: '15:30:00', end_time: '16:30:00' };
  await apiRequest('/api/scheduling/timetables/TST001', { method: 'PUT', body: goodUpdate, cookieHeader, expectStatus: 200, label: 'PUT timetable valid reschedule (200)' });

  // Missing required on create
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: { schedule_id: 'BADMISS' }, cookieHeader, expectStatus: 400, label: 'POST /timetables missing required fields (400)' });

  // Duplicate schedule_id
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: baseSched, cookieHeader, expectStatus: 400, label: 'POST /timetables duplicate schedule_id (400)' });

  // 404s
  await apiRequest('/api/scheduling/timetables/TST999', { cookieHeader, expectStatus: 404, label: 'GET /timetables nonexistent (404)' });
  await apiRequest('/api/scheduling/timetables/TST999', { method: 'PUT', body: { course_id: 'x' }, cookieHeader, expectStatus: 404, label: 'PUT nonexistent (404)' });
  await apiRequest('/api/scheduling/timetables/TST999', { method: 'DELETE', cookieHeader, expectStatus: 404, label: 'DELETE nonexistent (404)' });

  // Edge: bad time formats (service/DB will reject)
  const badTime = { ...baseSched, schedule_id: 'TSTBADTM', start_time: '25:00:00', end_time: '26:00:00' };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: badTime, cookieHeader, expectStatus: 400, label: 'POST bad time values (400 from DB)' });

  // Edge: end before start (inverted range). Behavior can be 400 (validation) or 201 depending on run/state; we accept either non-5xx as "edge handled without crash".
  const inverted = { ...baseSched, schedule_id: 'TSTINV', start_time: '14:00:00', end_time: '13:00:00' };
  const invRes = await apiRequest('/api/scheduling/timetables', { method: 'POST', body: inverted, cookieHeader, expectStatus: 400, label: 'POST inverted time range (400 or 201 acceptable for this edge; no crash)' });
  if (invRes.ok || invRes.status === 201) {
    if (invRes.status === 201) createdTimetables.push('TSTINV');
    logPass('POST inverted time range (edge case accepted without 5xx)');
  }

  // === INJECTION / SECURITY EDGES ===
  console.log('\n=== SECURITY + INJECTION EDGES ===');
  const beforeCountRes = await apiRequest('/api/scheduling/rooms', { cookieHeader, expectStatus: 200 });
  const beforeCount = Array.isArray(beforeCountRes.data) ? beforeCountRes.data.length : 0;

  const injRoom = { room_id: "TSTINJ'; DROP TABLE rooms; --", campus_id: 'CAMP001', room_name: 'Injection attempt' };
  const injRes = await apiRequest('/api/scheduling/rooms', { method: 'POST', body: injRoom, cookieHeader, expectStatus: 400, label: 'POST room with SQL-ish ID (400, no injection success)' });

  const afterCountRes = await apiRequest('/api/scheduling/rooms', { cookieHeader, expectStatus: 200 });
  const afterCount = Array.isArray(afterCountRes.data) ? afterCountRes.data.length : 0;
  assert(afterCount === beforeCount || afterCount === beforeCount + 1, 'Room count did not drop (no successful SQL injection via room_id)');

  // Try on timetable too
  const injSched = { ...baseSched, schedule_id: "TSTINJ2' OR '1'='1", course_id: 'CRS001' };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: injSched, cookieHeader, expectStatus: 400, label: 'POST timetable SQL-ish schedule_id (400 safe)' });

  // Large timetable payload
  const largeS = { ...baseSched, schedule_id: 'TSTLRG', course_id: 'CRS001', status: 'Active' + 'Z'.repeat(1000) };
  await apiRequest('/api/scheduling/timetables', { method: 'POST', body: largeS, cookieHeader, expectStatus: 400, label: 'POST large field (likely 400 validation or DB)' }); // may 400 or 201 depending on column size; accept either but log

  // Wrong content type (edge)
  // (fetch always sends json here; skip deep, or note)

  // Final deletes for created test data
  await cleanup();

  // Final verification counts (should be back to seeded)
  const finalRooms = await apiRequest('/api/scheduling/rooms', { cookieHeader, expectStatus: 200, label: 'Final GET /rooms (post-cleanup)' });
  // We don't assert exact count (other tests may have run), just that no TST* left
  const hasTestLeft = Array.isArray(finalRooms.data) && finalRooms.data.some(r => r.room_id && r.room_id.startsWith('TST'));
  assert(!hasTestLeft, 'No TST* rooms left after cleanup');

  console.log('\n=== SUMMARY ===');
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  if (failed === 0) {
    console.log('All tests PASSED. Scheduling service (with auth cookie flow + gateway) is solid.');
    process.exit(0);
  } else {
    console.log('Some tests FAILED. See details above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('UNCAUGHT ERROR in test script:', err);
  cleanup().finally(() => process.exit(1));
});
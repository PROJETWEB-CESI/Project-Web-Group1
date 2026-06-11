// Shared data-fetching helpers for the executive (cross-campus) dashboards.
// Aggregates per-campus stats and billing data so each executive page can
// render consolidated indicators without duplicating the fetch logic.

async function fetchJson(apiFetch, url) {
  try {
    const res = await apiFetch(url);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// Returns one entry per campus with academic stats, billing stats, and
// overdue payments merged together.
export async function fetchCampusOverview(apiFetch) {
  const campuses = (await fetchJson(apiFetch, '/api/students/campuses')) || [];
  const overdueAll = (await fetchJson(apiFetch, '/api/payments/overdue/all')) || [];
  const overdueMap = new Map(overdueAll.map((o) => [o.campusId, o]));

  return Promise.all(
    campuses.map(async (campus) => {
      const [stats, billing] = await Promise.all([
        fetchJson(apiFetch, `/api/students/campus/${campus.campusId}/stats`),
        fetchJson(apiFetch, `/api/payments/stats?campusId=${campus.campusId}`),
      ]);

      return {
        campusId: campus.campusId,
        campusName: campus.campusName,
        totalStudents: stats?.totalStudents ?? null,
        totalStudentsAll: stats?.totalStudentsAll ?? null,
        successRate: stats?.successRate ?? null,
        averageGrade: stats?.averageGrade ?? null,
        attendanceRate: stats?.attendanceRate ?? null,
        dropoutRate: stats?.dropoutRate ?? null,
        byProgram: stats?.byProgram ?? [],
        billing,
        overdue: overdueMap.get(campus.campusId) || { overdueCount: 0, overdueAmount: 0 },
      };
    })
  );
}

// Returns the active student headcount per entry year for a given campus.
export async function fetchEnrollmentTrend(apiFetch, campusId) {
  return (await fetchJson(apiFetch, `/api/students/campus/${campusId}/trend`)) || [];
}

// Average of an array of numbers, ignoring null/undefined values.
export function average(values, decimals = 1) {
  const valid = values.filter((v) => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return +(valid.reduce((sum, v) => sum + v, 0) / valid.length).toFixed(decimals);
}

export function sum(values) {
  return values.reduce((total, v) => total + (v ?? 0), 0);
}

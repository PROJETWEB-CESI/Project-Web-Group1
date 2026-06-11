'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_FR = { Monday: 'Lundi', Tuesday: 'Mardi', Wednesday: 'Mercredi', Thursday: 'Jeudi', Friday: 'Vendredi' };

function dayNameOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}
function timeToMin(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}
function timesOverlap(sA, eA, sB, eB) {
  return timeToMin(sA) < timeToMin(eB) && timeToMin(sB) < timeToMin(eA);
}

const TYPE_PALETTE = {
  'Amphithéâtre':       { strip: 'bg-violet-500',  badge: 'bg-violet-500/10 text-violet-700',   dot: 'bg-violet-500' },
  'Computer Lab':       { strip: 'bg-blue-500',     badge: 'bg-blue-500/10 text-blue-700',       dot: 'bg-blue-500' },
  'Salle informatique': { strip: 'bg-blue-500',     badge: 'bg-blue-500/10 text-blue-700',       dot: 'bg-blue-500' },
  'Lecture Hall':       { strip: 'bg-cyan-500',     badge: 'bg-cyan-500/10 text-cyan-700',       dot: 'bg-cyan-500' },
  'Tutorial Room':      { strip: 'bg-teal-500',     badge: 'bg-teal-500/10 text-teal-700',       dot: 'bg-teal-500' },
  'Salle de TD':        { strip: 'bg-amber-500',    badge: 'bg-amber-500/10 text-amber-700',     dot: 'bg-amber-500' },
  'Laboratoire':        { strip: 'bg-emerald-500',  badge: 'bg-emerald-500/10 text-emerald-700', dot: 'bg-emerald-500' },
  'Salle de réunion':   { strip: 'bg-orange-500',   badge: 'bg-orange-500/10 text-orange-700',   dot: 'bg-orange-500' },
};
function typeConfig(type) {
  return TYPE_PALETTE[type] || { strip: 'bg-[var(--color-border)]', badge: 'bg-[var(--color-surface)] text-[var(--color-text-muted)]', dot: 'bg-[var(--color-border)]' };
}

function EquipmentPills({ equipment }) {
  if (!equipment) return null;
  const items = equipment.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item, i) => (
        <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          {item}
        </span>
      ))}
    </div>
  );
}

function RoomCard({ room, isAvailable, isSelected, onClick, timetableSlots, reservationSlots }) {
  const tc = typeConfig(room.room_type);
  const allSlots = [...timetableSlots, ...reservationSlots];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border bg-[var(--color-bg-elev)] overflow-hidden flex shadow-sm transition-all duration-150
        ${isSelected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-md'
          : isAvailable
          ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md'
          : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]/30 hover:shadow-md opacity-60 hover:opacity-80'
        }`}
    >
      <div className={`w-1.5 flex-shrink-0 ${isAvailable ? tc.strip : 'bg-[var(--color-border)]'}`} />
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--color-text)] truncate leading-tight">{room.room_name || room.room_id}</div>
            {(room.building || room.floor != null) && (
              <div className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                {[room.building, room.floor != null && `Étage ${room.floor}`].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            isAvailable
              ? 'bg-emerald-500/12 text-emerald-700 border border-emerald-500/20'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
          }`}>
            {isAvailable ? '✓ Libre' : '✕ Occupée'}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          {room.capacity != null && (
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
              </svg>
              <span className="text-xs font-semibold text-[var(--color-text)]">{room.capacity}</span>
              <span className="text-xs text-[var(--color-text-muted)]">places</span>
            </div>
          )}
          {room.room_type && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${tc.badge}`}>
              {room.room_type}
            </span>
          )}
        </div>

        {!isAvailable && allSlots.length > 0 && (
          <div className="space-y-1 mt-2 pt-2 border-t border-[var(--color-border)]">
            {allSlots.map((slot, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 flex-shrink-0 ${slot._isReservation ? 'text-violet-400' : 'text-red-400'}`}>
                  <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                </svg>
                <span className="font-mono text-[var(--color-text-muted)] whitespace-nowrap flex-shrink-0">{slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)}</span>
                <span className="truncate text-[var(--color-text)] font-medium">{slot._isReservation ? (slot.purpose || 'Réservé') : (slot.course?.course_name || slot.course_id)}</span>
                {slot._isReservation && <span className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700">Réservation</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default function TeacherRoomsPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const today = new Date().toISOString().slice(0, 10);

  const [rooms, setRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [minCapacity, setMinCapacity] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Reservation form state
  const [showReserveForm, setShowReserveForm] = useState(false);
  const [reservePurpose, setReservePurpose] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState(false);

  const fetchJson = useCallback(async (url) => {
    try { const res = await apiFetch(url); return res.ok ? await res.json() : null; }
    catch { return null; }
  }, [apiFetch]);

  useEffect(() => {
    if (!user?.campusId) return;
    Promise.all([
      fetchJson(`/api/rooms?campus_id=${user.campusId}`),
      fetchJson('/api/timetables/'),
      fetchJson(`/api/reservations?campus_id=${user.campusId}`),
    ]).then(([r, t, rv]) => {
      setRooms(Array.isArray(r) ? r : []);
      setTimetables(Array.isArray(t) ? t : []);
      setReservations(Array.isArray(rv) ? rv : []);
      setLoading(false);
    });
  }, [user, fetchJson]);

  // Reset form when room or search params change
  useEffect(() => {
    setShowReserveForm(false);
    setReserveError('');
    setReserveSuccess(false);
    setReservePurpose('');
  }, [selectedRoom, date, startTime, endTime]);

  const dayName = useMemo(() => date ? dayNameOf(date) : null, [date]);
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
  const timeValid = useMemo(() => timeToMin(startTime) < timeToMin(endTime), [startTime, endTime]);

  // Occupancy: timetable entries (by day_of_week) + reservations (by specific date)
  const roomOccupancy = useMemo(() => {
    const map = {};
    for (const room of rooms) {
      const tt = timetables.filter(t =>
        t.room_id === room.room_id &&
        t.day_of_week === dayName &&
        timesOverlap(startTime, endTime, t.start_time, t.end_time)
      );
      const rv = reservations
        .filter(r =>
          r.room_id === room.room_id &&
          r.date === date &&
          r.status === 'confirmed' &&
          timesOverlap(startTime, endTime, r.start_time, r.end_time)
        )
        .map(r => ({ ...r, _isReservation: true }));
      map[room.room_id] = { timetable: tt, reservations: rv };
    }
    return map;
  }, [rooms, timetables, reservations, dayName, date, startTime, endTime]);

  const roomTypes = useMemo(() => [...new Set(rooms.map(r => r.room_type).filter(Boolean))].sort(), [rooms]);

  const { available, occupied } = useMemo(() => {
    let f = rooms.filter(r => r.status !== 'Inactive');
    if (minCapacity) f = f.filter(r => (r.capacity || 0) >= parseInt(minCapacity));
    if (roomTypeFilter) f = f.filter(r => r.room_type === roomTypeFilter);
    const avail = [], occ = [];
    for (const r of f) {
      const { timetable, reservations: rv } = roomOccupancy[r.room_id] || {};
      ((timetable?.length || rv?.length) ? occ : avail).push(r);
    }
    return { available: avail, occupied: occ };
  }, [rooms, roomOccupancy, minCapacity, roomTypeFilter]);

  const selectedRoomSchedule = useMemo(() => {
    if (!selectedRoom) return {};
    const s = {};
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      s[day] = timetables
        .filter(t => t.room_id === selectedRoom.room_id && t.day_of_week === day)
        .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time));
    }
    return s;
  }, [selectedRoom, timetables]);

  // My own reservations for selected room
  const myReservations = useMemo(() => {
    if (!selectedRoom || !user?.instructorId) return [];
    return reservations
      .filter(r => r.room_id === selectedRoom.room_id && r.instructor_id === user.instructorId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  }, [selectedRoom, reservations, user]);

  const selectedIsAvailable = selectedRoom
    ? !(roomOccupancy[selectedRoom.room_id]?.timetable?.length || roomOccupancy[selectedRoom.room_id]?.reservations?.length)
    : false;

  const handleReserve = useCallback(async () => {
    if (!selectedRoom || !user?.instructorId || !user?.campusId) return;
    setReserving(true);
    setReserveError('');
    try {
      const res = await apiFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: selectedRoom.room_id,
          instructor_id: user.instructorId,
          campus_id: user.campusId,
          date,
          start_time: startTime,
          end_time: endTime,
          purpose: reservePurpose.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setReserveError(err.error || 'Erreur lors de la réservation');
      } else {
        const saved = await res.json();
        setReservations(prev => [...prev, saved]);
        setReserveSuccess(true);
        setShowReserveForm(false);
        setReservePurpose('');
      }
    } catch {
      setReserveError('Erreur réseau');
    }
    setReserving(false);
  }, [selectedRoom, user, date, startTime, endTime, reservePurpose, apiFetch]);

  const handleCancel = useCallback(async (reservationId) => {
    try {
      const res = await apiFetch(`/api/reservations/${reservationId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setReservations(prev => prev.filter(r => r.id !== reservationId));
        setReserveSuccess(false);
      }
    } catch {}
  }, [apiFetch]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">Chargement…</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Salles & Disponibilités</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Trouvez une salle libre pour votre créneau et réservez-la en un clic</p>
      </div>

      {/* Search panel */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Date', type: 'date', value: date, onChange: e => setDate(e.target.value),
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2 2 0 0 1 14 5v7.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75Z" clipRule="evenodd" /></svg> },
            { label: 'Début', type: 'time', value: startTime, onChange: e => setStartTime(e.target.value),
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" /></svg> },
            { label: 'Fin', type: 'time', value: endTime, onChange: e => setEndTime(e.target.value), invalid: !timeValid,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm4.03 2.47a.75.75 0 0 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 0 0-1.06 1.06L6.44 7.5H4.5a.75.75 0 0 0 0 1.5h1.94l-1.41 1.47Z" clipRule="evenodd" /></svg> },
          ].map(({ label, type, value, onChange, icon, invalid }) => (
            <div key={label}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                <span className="opacity-70">{icon}</span>{label}
              </label>
              <input type={type} value={value} onChange={onChange}
                className={`w-full px-3 py-2.5 text-sm font-medium rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] outline-none transition-colors
                  ${invalid ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}`}
              />
              {invalid && <p className="text-xs text-red-500 mt-1">Doit être après le début</p>}
            </div>
          ))}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
              </svg>
              Capacité min.
            </label>
            <input type="number" min={1} placeholder="—" value={minCapacity} onChange={e => setMinCapacity(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        {roomTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-muted)] mr-1">Type :</span>
            {[{ label: 'Tous', value: '' }, ...roomTypes.map(t => ({ label: t, value: t }))].map(({ label, value }) => {
              const active = roomTypeFilter === value;
              const tc = value ? typeConfig(value) : null;
              return (
                <button key={label} onClick={() => setRoomTypeFilter(value)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                           : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {tc && !active && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tc.dot}`} />}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekend notice */}
      {isWeekend && (
        <div className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-amber-600">
              <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Week-end sélectionné</p>
            <p className="text-xs text-amber-700 mt-0.5">Aucune séance planifiée — seules les réservations ponctuelles apparaissent</p>
          </div>
        </div>
      )}

      {timeValid && (
        <div className={`grid gap-6 ${selectedRoom ? 'lg:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Libres', value: available.length, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', dot: 'bg-emerald-500' },
                { label: 'Occupées', value: occupied.length, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/10', dot: 'bg-red-400' },
              ].map(({ label, value, color, bg, border, dot }) => (
                <div key={label} className={`rounded-xl border ${border} ${bg} px-4 py-3 flex items-center gap-3`}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
                    <div className={`text-xl font-extrabold ${color}`}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs text-[var(--color-text-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 opacity-50">
                <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
              </svg>
              Créneau {startTime}–{endTime} · {DAY_FR[dayName] || dayName}
              {date === today && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold">Aujourd'hui</span>}
            </div>

            {available.length === 0 && occupied.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[var(--color-text-muted)] opacity-40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Aucune salle trouvée</p>
                <p className="text-xs text-[var(--color-text-muted)]">Réduisez la capacité minimale ou retirez le filtre de type</p>
              </div>
            )}

            {available.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <h2 className="text-sm font-bold text-[var(--color-text)]">Disponibles</h2>
                  <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">{available.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {available.map(room => (
                    <RoomCard key={room.room_id} room={room} isAvailable
                      isSelected={selectedRoom?.room_id === room.room_id}
                      onClick={() => setSelectedRoom(r => r?.room_id === room.room_id ? null : room)}
                      timetableSlots={[]} reservationSlots={[]}
                    />
                  ))}
                </div>
              </div>
            )}

            {occupied.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <h2 className="text-sm font-bold text-[var(--color-text-muted)]">Occupées sur ce créneau</h2>
                  <span className="ml-auto text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">{occupied.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {occupied.map(room => (
                    <RoomCard key={room.room_id} room={room} isAvailable={false}
                      isSelected={selectedRoom?.room_id === room.room_id}
                      onClick={() => setSelectedRoom(r => r?.room_id === room.room_id ? null : room)}
                      timetableSlots={roomOccupancy[room.room_id]?.timetable || []}
                      reservationSlots={roomOccupancy[room.room_id]?.reservations || []}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedRoom && (() => {
            const tc = typeConfig(selectedRoom.room_type);
            return (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden h-fit sticky top-4 shadow-md">
                <div className={`h-1.5 w-full ${selectedIsAvailable ? tc.strip : 'bg-red-400'}`} />

                {/* Header */}
                <div className="px-5 pt-4 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-[var(--color-text)] leading-tight truncate">{selectedRoom.room_name || selectedRoom.room_id}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {[selectedRoom.building, selectedRoom.floor != null && `Étage ${selectedRoom.floor}`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button onClick={() => setSelectedRoom(null)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedIsAvailable ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                      {selectedIsAvailable ? '✓ Libre sur ce créneau' : '✕ Occupée sur ce créneau'}
                    </span>
                    {selectedRoom.room_type && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>{selectedRoom.room_type}</span>
                    )}
                  </div>
                </div>

                {/* Capacity + building */}
                <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
                  <div className="px-4 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Capacité</div>
                    <div className="text-2xl font-extrabold text-[var(--color-text)] mt-0.5">{selectedRoom.capacity ?? '—'}</div>
                    {selectedRoom.capacity && <div className="text-[10px] text-[var(--color-text-muted)]">places</div>}
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Bâtiment</div>
                    <div className="text-lg font-extrabold text-[var(--color-text)] mt-0.5 truncate">{selectedRoom.building || '—'}</div>
                    {selectedRoom.floor != null && <div className="text-[10px] text-[var(--color-text-muted)]">Étage {selectedRoom.floor}</div>}
                  </div>
                </div>

                {/* Equipment */}
                {selectedRoom.equipment && (
                  <div className="px-5 py-3 border-b border-[var(--color-border)]">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Équipements</div>
                    <EquipmentPills equipment={selectedRoom.equipment} />
                  </div>
                )}

                {/* ── RESERVATION SECTION ── */}
                {selectedIsAvailable && (
                  <div className="px-5 py-4 border-b border-[var(--color-border)] bg-emerald-500/3">
                    {reserveSuccess ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                        Salle réservée pour {startTime}–{endTime}
                      </div>
                    ) : !showReserveForm ? (
                      <button
                        onClick={() => setShowReserveForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2 2 0 0 1 14 5v7.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 7a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Zm0 3a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" clipRule="evenodd" />
                        </svg>
                        Réserver · {startTime}–{endTime}
                      </button>
                    ) : (
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text)] mb-2">Réserver le {new Date(...date.split('-').map(Number).map((v, i) => i === 1 ? v - 1 : v)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                          </svg>
                          {startTime} – {endTime}
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">Motif <span className="font-normal">(facultatif)</span></label>
                          <input
                            type="text"
                            placeholder="ex. Cours de rattrapage, Réunion pédagogique…"
                            value={reservePurpose}
                            onChange={e => setReservePurpose(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !reserving && handleReserve()}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        {reserveError && (
                          <p className="text-xs text-red-600 font-medium mb-2">{reserveError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleReserve}
                            disabled={reserving}
                            className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {reserving ? 'Réservation…' : 'Confirmer'}
                          </button>
                          <button
                            onClick={() => { setShowReserveForm(false); setReserveError(''); }}
                            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-sm font-semibold hover:bg-[var(--color-bg-elev)] transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* My reservations for this room */}
                {myReservations.length > 0 && (
                  <div className="px-5 py-3 border-b border-[var(--color-border)]">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Mes réservations</div>
                    <div className="space-y-1.5">
                      {myReservations.map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-xs bg-violet-500/5 border border-violet-500/15 rounded-lg px-2.5 py-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-[var(--color-text-muted)]">{r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}</span>
                            <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
                            <span className="text-[var(--color-text)] font-medium">{new Date(r.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            {r.purpose && <span className="block text-[var(--color-text-muted)] truncate mt-0.5">{r.purpose}</span>}
                          </div>
                          <button onClick={() => handleCancel(r.id)}
                            className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Annuler la réservation">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly schedule */}
                <div className="px-5 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">Planning de la semaine</div>
                  <div className="space-y-3">
                    {Object.entries(selectedRoomSchedule).map(([day, slots]) => {
                      const isSelectedDay = day === dayName;
                      return (
                        <div key={day} className={`rounded-xl p-3 ${isSelectedDay ? 'bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15' : 'bg-[var(--color-surface)]'}`}>
                          <div className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 ${isSelectedDay ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                            {DAY_FR[day]}
                            {isSelectedDay && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/15">sélectionné</span>}
                          </div>
                          {slots.length === 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              Libre toute la journée
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {slots.map((slot, i) => {
                                const isConflict = isSelectedDay && timesOverlap(startTime, endTime, slot.start_time, slot.end_time);
                                return (
                                  <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${isConflict ? 'bg-red-500/8 border border-red-200' : 'bg-[var(--color-bg-elev)]'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConflict ? 'bg-red-500' : 'bg-[var(--color-text-muted)]'}`} />
                                    <span className={`font-mono whitespace-nowrap flex-shrink-0 ${isConflict ? 'text-red-600 font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                                      {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}
                                    </span>
                                    <span className="truncate text-[var(--color-text)]">{slot.course?.course_name || slot.course_id}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

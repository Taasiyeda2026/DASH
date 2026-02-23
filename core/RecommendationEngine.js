import { getSuggestionRangeISO } from './DateUtils.js';
import { getDistanceKm } from './GeoUtils.js';
import { computeDayTravelStats } from './TravelEngine.js';
import { computeDailyLoad, computeWeeklyLoad, computeMonthlyLoad } from './LoadEngine.js';
import { computeFutureLoad } from './FutureEngine.js';
import { validateHardRules } from './HardRulesEngine.js';
import { scoreCandidate } from './ScoringEngine.js';
import { buildExplanation } from './ExplainabilityEngine.js';

function timeToMin(raw, fallback){
  if (typeof raw !== 'string') return fallback;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minToTime(min){
  const hh = String(Math.floor(min / 60)).padStart(2, '0');
  const mm = String(min % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function findSlot(data, employeeID, dateISO, durationMin){
  const events = [];
  for (const c of (data.courses || [])) {
    if (String(c.EmployeeID) !== String(employeeID)) continue;
    const hasDate = (c.Dates || []).some((d) => {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? String(d) : null;
      return iso === dateISO;
    });
    if (!hasDate) continue;

    const s = timeToMin(c.StartTime, 8 * 60);
    const e = timeToMin(c.EndTime, 15 * 60);
    events.push({ startMin: s, endMin: e, authority: String(c.Authority || '').trim() });
  }
  events.sort((a, b) => a.startMin - b.startMin);

  let cursor = 8 * 60;
  for (const ev of events) {
    if ((ev.startMin - cursor) >= durationMin) {
      return { startMin: cursor, endMin: cursor + durationMin, events };
    }
    cursor = Math.max(cursor, ev.endMin);
  }
  if ((15 * 60 - cursor) >= durationMin) {
    return { startMin: cursor, endMin: cursor + durationMin, events };
  }
  return { startMin: null, endMin: null, events };
}

function normalizeCourseDatesToISO(data){
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const toISO = (raw) => {
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (typeof raw === 'number') {
      const dt = new Date(excelEpoch.getTime() + raw * 86400000);
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  return {
    ...data,
    courses: (data.courses || []).map((c) => ({
      ...c,
      Dates: (c.Dates || []).map(toISO).filter(Boolean)
    }))
  };
}

export function buildGlobalRecommendations(data, targetAuthority, durationMin, topN){
  const normalized = normalizeCourseDatesToISO(data);
  const instructors = (normalized.instructors || []).filter((i) => String(i.Role || '').toLowerCase() === 'instructor');
  const debugStats = {
    rejectedByTime: 0,
    rejectedByDistance: 0,
    rejectedByTravel: 0,
    rejectedByFutureConflict: 0,
    validCandidates: 0
  };

  const bestByInstructor = new Map();
  for (const dateISO of getSuggestionRangeISO()) {
    for (const inst of instructors) {
      const employeeID = String(inst.EmployeeID);
      const distHome = getDistanceKm(normalized, String(inst.HomeAuthority || '').trim(), targetAuthority);
      const daily = computeDailyLoad(normalized, employeeID, dateISO);
      const weekly = computeWeeklyLoad(normalized, employeeID, dateISO);
      const monthly = computeMonthlyLoad(normalized, employeeID, dateISO);
      const future = computeFutureLoad(normalized, employeeID, dateISO, targetAuthority);
      const slot = findSlot(normalized, employeeID, dateISO, durationMin);
      const travel = computeDayTravelStats(normalized, slot.events, targetAuthority);

      let interAuthorityKm = 0;
      for (const a of daily.authorities) {
        if (!a || a === targetAuthority) continue;
        const km = getDistanceKm(normalized, a, targetAuthority);
        if (km !== null) interAuthorityKm = Math.max(interAuthorityKm, km);
      }

      const hard = validateHardRules({ freeSlot: slot.startMin !== null, daily, distHome, interAuthorityKm, travel, future });
      if (!hard.ok) {
        if (hard.reason.includes('חלון')) debugStats.rejectedByTime++;
        else if (hard.reason.includes('distHome')) debugStats.rejectedByDistance++;
        else if (hard.reason.includes('מעבר') || hard.reason.includes('קפיצה')) debugStats.rejectedByTravel++;
        else if (hard.reason.includes('קונפליקט')) debugStats.rejectedByFutureConflict++;
        continue;
      }

      const scoringInput = {
        distHome,
        daily: { ...daily, ...travel },
        weekly,
        monthly,
        future,
        alreadyInAuthority: daily.authorities.includes(targetAuthority)
      };
      const scored = scoreCandidate(scoringInput);
      const candidate = {
        employeeID,
        name: inst.Employee || '—',
        dateISO,
        start: minToTime(slot.startMin),
        end: minToTime(slot.endMin),
        distHome,
        daily: { ...daily, ...travel },
        weekly,
        monthly,
        future,
        score: scored.score,
        quality: scored.quality
      };
      candidate.explanation = buildExplanation(candidate);
      debugStats.validCandidates++;

      const prev = bestByInstructor.get(employeeID);
      if (!prev || candidate.score > prev.score) bestByInstructor.set(employeeID, candidate);
    }
  }

  const recommendations = [...bestByInstructor.values()].sort((a, b) => b.score - a.score).slice(0, topN);
  return { recommendations, debugStats };
}

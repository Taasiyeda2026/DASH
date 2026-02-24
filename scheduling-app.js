import { buildGlobalRecommendations } from './core/RecommendationEngine.js';
import { renderResults } from './core/RenderEngine.js';

const DEBUG = true;

function showStatus(id, msg, type){
  const box = document.getElementById(id);
  box.textContent = msg;
  box.className = `status ${type}`;
  box.style.display = 'block';
}

function clearStatus(id){
  const box = document.getElementById(id);
  box.style.display = 'none';
  box.textContent = '';
}

async function loadSchedulingData(){
  const res = await fetch('data/Scheduling/scheduling.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('load failed');
  return res.json();
}

let lastCourseRows = [];

function computeInstructorRows(data){
  const map = new Map();
  for (const c of (data.courses || [])) {
    if (String(c.EventType || '').toUpperCase() !== 'COURSE') continue;
    const id = String(c.EmployeeID);
    if (!map.has(id)) map.set(id, { name: c.Employee || '—', coursesCount: 0 });
    map.get(id).coursesCount += 1;
  }

  return [...map.values()].sort((a, b) => b.coursesCount - a.coursesCount);
}

function renderCoursesTable(rows){
  const tbody = document.getElementById('coursesBody');
  const q = (document.getElementById('coursesSearch').value || '').trim();
  const filtered = q ? rows.filter((r) => r.name.includes(q)) : rows;

  tbody.innerHTML = '';
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="muted">לא נמצאו מדריכים.</td></tr>';
    return;
  }

  filtered.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="ellipsis">${r.name}</td><td class="num short">${r.coursesCount}</td>`;
    tbody.appendChild(tr);
  });
}

export function renderCoursesTableFromLast(){
  renderCoursesTable(lastCourseRows);
}
window.renderCoursesTableFromLast = renderCoursesTableFromLast;

async function boot(){
  clearStatus('statusBoxCourses');
  clearStatus('statusBox2');

  try {
    const data = await loadSchedulingData();
    const authorities = Object.keys(data.authorityLocations || {}).sort((a, b) => a.localeCompare(b, 'he'));

    const sel = document.getElementById('authoritySelect');
    sel.innerHTML = '';
    authorities.forEach((a) => {
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = a;
      sel.appendChild(opt);
    });

    lastCourseRows = computeInstructorRows(data);
    renderCoursesTable(lastCourseRows);
    showStatus('statusBoxCourses', `נטענו ${lastCourseRows.length} מדריכים.`, 'ok');
  } catch (err) {
    console.error(err);
    showStatus('statusBoxCourses', 'שגיאה בטעינת scheduling.json.', 'error');
  }
}

export async function runSuggestions(){
  clearStatus('statusBox2');
  document.getElementById('resultsList').innerHTML = '<div class="loading-placeholder muted">מחשב הצעות…</div>';

  const targetAuthority = document.getElementById('authoritySelect').value;
  const topN = Number(document.getElementById('topN').value);
  const durationMin = Number(document.getElementById('durationMin').value);

  if (!targetAuthority) return showStatus('statusBox2', 'יש לבחור רשות יעד.', 'error');
  if (!Number.isFinite(durationMin) || durationMin < 30) return showStatus('statusBox2', 'משך קורס לא תקין.', 'error');

  try {
    const data = await loadSchedulingData();
    const { recommendations, debugStats } = buildGlobalRecommendations(data, targetAuthority, durationMin, topN);
    renderResults(recommendations);
    if (DEBUG) console.table(debugStats);
    showStatus('statusBox2', `נמצאו ${recommendations.length} המלצות גלובליות.`, 'ok');
  } catch (err) {
    console.error(err);
    showStatus('statusBox2', 'שגיאה בבניית ההמלצות.', 'error');
  }
}
window.runSuggestions = runSuggestions;

export function goBackToDashboard(){
  location.href = 'index.html';
}
window.goBackToDashboard = goBackToDashboard;

boot();

function excelSerialToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const msPerDay = 86400000;
  const date = new Date(excelEpoch.getTime() + serial * msPerDay);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function excelDecimalToTime(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number') {
    const totalMinutes = Math.round(v * 24 * 60);
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const m = String(totalMinutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(v);
}

function normalizeData(data){
  return data.map(r=>({
    ...r,
    StartTime: excelDecimalToTime(r.StartTime),
    EndTime: excelDecimalToTime(r.EndTime),
    End: (typeof r.End === 'number') ? excelSerialToJSDate(r.End) : (r.End ? new Date(r.End) : null),
    Dates: Array.isArray(r.Dates)
      ? r.Dates.map(d => excelSerialToJSDate(d)).filter(Boolean)
      : []
  }));
}

rawData = normalizeData(rawData);

function enforceInstructorMode(){
  if(userRole === 'instructor'){
    window.mode = 'month';
  }
}

const view=document.getElementById('view');
const titleEl=document.getElementById('title');
const filtersEl=document.getElementById('filters');
const side=document.getElementById('side');
const sideContent=document.getElementById('sideContent');
const btnMonth=document.getElementById('btnMonth');
const btnWeek=document.getElementById('btnWeek');
const btnSummary=document.getElementById('btnSummary');
const btnInstructors=document.getElementById('btnInstructors');
const goCalendar = document.getElementById('goCalendar');
const managerFilter=document.getElementById('managerFilter');
const employeeFilter=document.getElementById('employeeFilter');
const summaryMonth=document.getElementById('summaryMonth');

function updateSchedulingButtonVisibility(){
  const btn = document.getElementById('btnScheduling');
  if(!btn) return;

  const id = String(window.EmployeeID || '').trim();

  if(id === '6000' || id === '8000'){
    btn.style.display = '';
  }else{
    btn.style.display = 'none';
  }
}

if(userRole === 'instructor'){
  btnSummary.style.display = 'none';
  btnInstructors.style.display = 'none';
  btnMonth.style.display = 'none';
  btnWeek.style.display = 'none';
  filtersEl.style.display = 'none';
  window.mode = 'month';
}

let dataRange=null;
let _mode='month';
Object.defineProperty(window, 'mode', {
  get(){ return _mode; },
  set(value){
    if(userRole === 'instructor'){
      _mode = 'month';
      return;
    }
    _mode = value;
  },
  configurable: false
});
let mobileWeekOpen = false;
let mobileWeekStart = null;
let currentDate=new Date(); currentDate.setHours(0,0,0,0);
const dayNames=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

const employeeColors = {
  "הנאא אבו אמזה": "#f9d3d3", "יונתן יהונתן פתייה": "#fdf1d3", "אביב בלנדר": "#d3f4f9",
  "אסיל ג'בר": "#dcd3f9", "ברקת קטעי": "#d3f9de", "אלכס זפקה": "#FFDEBD",
  "עליזה מולה": "#CCFFFF", "ליאל בן חמו": "#FEFEB4", "אפרת אוחיון": "#FFFFCC",
  "אלדר מיכאל טייב": "#A3E0FF", "הילה רוזן": "#f9d3eb", "תמר שפיר": "#EAEAEA",
  "אילנה טיטייבסקי": "#d3f9d8", "כרמית סמנדרוב": "#E8D1FF", "מיכל שכטמן": "#d3f9f4",
  "ראנה סאלח": "#f6d3f9", "סוהא סאלם": "#f9f6d3", "קרן גורביץ": "#d3eff9"
};

function getEmployeeColor(name) {
  if (!name || name.trim() === "") return "#ffffff";
  return employeeColors[name.trim()] || "#f1f5f9";
}

function formatTime(v){
  if(v==null||v==='') return '';
  if(typeof v==='number'){
    const totalMinutes = Math.round(v * 24 * 60);
    const h = String(Math.floor(totalMinutes/60)).padStart(2,'0');
    const m = String(totalMinutes%60).padStart(2,'0');
    return `${h}:${m}`;
  }
  return String(v);
}

const sameDay=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

function parseDate(v){
  if(!v) return null;
  const d=new Date(v);
  return isNaN(d)?null:d;
}

function isCourse(r){
  return String(r.EventType || '').trim().toUpperCase() === 'COURSE';
}


function getCourseManager(r){
  return String(r.CourseManager ?? '').trim();
}

function getInstructorManager(r){
  return String(r.InstructorManager ?? '').trim();
}

function getManagerForCourseViews(r){
  return userRole === 'instructor' ? getInstructorManager(r) : getCourseManager(r);
}

function isCourseActiveInMonth(r, year, month){
  return isCourse(r) &&
    r.Dates.some(d =>
      d &&
      d.getFullYear() === year &&
      d.getMonth() === month
    );
}

function isCourseEndingInMonth(r, year, month){
  if(!isCourse(r) || !r.End) return false;
  const d = parseDate(r.End);
  return d &&
         d.getFullYear() === year &&
         d.getMonth() === month;
}

function getBusiestWeekWorkDays(courses, year, month){
  const weeksMap = {};

  courses.forEach(r=>{
    if(String(r.EventType || '').trim().toUpperCase() !== 'COURSE') return;

    r.Dates.forEach(d=>{
      if(
        d &&
        d.getFullYear() === year &&
        d.getMonth() === month
      ){
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        weekStart.setHours(0,0,0,0);

        const key = weekStart.toISOString();

        if(!weeksMap[key]){
          weeksMap[key] = new Set();
        }

        weeksMap[key].add(d.toDateString());
      }
    });
  });

  let maxDays = 0;

  Object.values(weeksMap).forEach(set=>{
    if(set.size > maxDays){
      maxDays = set.size;
    }
  });

  return maxDays;
}

function clampDateToDataRange(date){
  const d = new Date(date);
  d.setHours(0,0,0,0);
  if(!dataRange) return d;
  if(d < dataRange.min) return new Date(dataRange.min);
  if(d > dataRange.max) return new Date(dataRange.max);
  return d;
}

function weekOverlapsDataRange(date){
  if(!dataRange) return true;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0,0,0,0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(0,0,0,0);

  return weekEnd >= dataRange.min && weekStart <= dataRange.max;
}

function getMinAllowedMonth(){
  const today = new Date();
  today.setHours(0,0,0,0);
  return new Date(today.getFullYear(), today.getMonth()-1, 1);
}

function canGoPrev(){
  if(window.mode === 'summary'){
    if(summaryMonth.selectedIndex <= 0) return false;

    const prevOption = summaryMonth.options[summaryMonth.selectedIndex-1].value;
    const [y,m] = prevOption.split('-').map(Number);
    const prevDate = new Date(y,m,1);

    return prevDate >= getMinAllowedMonth();
  }
  if(!dataRange) return false;

  if(window.mode === 'month'){
    const temp = new Date(currentDate);
    temp.setMonth(temp.getMonth()-1);

    return temp >= getMinAllowedMonth();
  }

  if(window.mode === 'week'){
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate()-7);

    const minAllowed = getMinAllowedMonth();

    return temp >= minAllowed;
  }

  return false;
}

function canGoNext(){
  if(window.mode === 'summary') return summaryMonth.selectedIndex < summaryMonth.options.length-1;
  if(!dataRange) return false;

  if(window.mode === 'month'){
    const temp = new Date(currentDate);
    temp.setMonth(temp.getMonth()+1);
    return temp.getFullYear() < dataRange.max.getFullYear() ||
      (temp.getFullYear() === dataRange.max.getFullYear() && temp.getMonth() <= dataRange.max.getMonth());
  }

  if(window.mode === 'week'){
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate()+7);
    return weekOverlapsDataRange(temp);
  }

  return false;
}

function updateNavButtons(){
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  prevBtn.disabled = !canGoPrev();
  nextBtn.disabled = !canGoNext();
}

function updateModeButtons(){
  btnMonth.classList.remove('active');
  btnWeek.classList.remove('active');
  btnSummary.classList.remove('active');
  btnInstructors.classList.remove('active');

  if(window.mode === 'month') btnMonth.classList.add('active');
  if(window.mode === 'week') btnWeek.classList.add('active');
  if(window.mode === 'summary') btnSummary.classList.add('active');
  if(window.mode === 'instructors') btnInstructors.classList.add('active');
}

function endDate(r){
  const d=r.Dates.filter(Boolean);
  return d.length?new Date(Math.max(...d.map(x=>x.getTime()))):null;
}

function getDataDateRange(){
  const allDates = rawData.flatMap(r => r.Dates.filter(Boolean));

  if(allDates.length === 0) return null;

  const min = new Date(Math.min(...allDates.map(d=>d.getTime())));
  const max = new Date(Math.max(...allDates.map(d=>d.getTime())));

  min.setHours(0,0,0,0);
  max.setHours(0,0,0,0);

  return { min, max };
}

function initFromRawData(){
  dataRange = getDataDateRange();
  window.dataRange = dataRange;
  initFilters();
  initSummaryMonths();
  currentDate = clampDateToDataRange(new Date());

  const name = sessionStorage.getItem('dash_name') || '';
  const greetingEl = document.getElementById('greetingName');
  if(greetingEl && name) greetingEl.textContent = `שלום, ${name}`;

  updateSchedulingButtonVisibility();

  window.mode='week';
  render();
}

function initFilters(){
  const managers=[...new Set(rawData.map(r=>getCourseManager(r)).filter(Boolean))];
  const employees=[...new Set(rawData.map(r=>r.Employee).filter(Boolean))];
  managerFilter.innerHTML='<option value="">כל המנהלים</option>'+managers.map(v=>`<option>${v}</option>`).join('');
  employeeFilter.innerHTML='<option value="">כל המדריכים</option>'+employees.map(v=>`<option>${v}</option>`).join('');
}

function initSummaryMonths(){
  const months=[...new Set(rawData.flatMap(r=>r.Dates.filter(Boolean)).map(d=>`${d.getFullYear()}-${d.getMonth()}`))].sort();
  summaryMonth.innerHTML=months.map(k=>{
    const [y,m]=k.split('-').map(Number);
    return `<option value="${k}">${new Date(y,m).toLocaleString('he-IL',{month:'long',year:'numeric'})}</option>`;
  }).join('');
  const todayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const idx = months.indexOf(todayKey);
  if(idx >= 0) summaryMonth.selectedIndex = idx;
}

function render(){

  enforceInstructorMode();
  view.innerHTML='';
  side.classList.remove('open');
  mobileWeekOpen = false;
  mobileWeekStart = null;

  if(userRole === 'instructor' || window.mode === 'summary' || window.mode === 'instructors'){
    filtersEl.style.display = 'none';
  }else{
    filtersEl.style.display = 'flex';
  }

  const isMobile = window.innerWidth < 800;

  if(isMobile && (window.mode === 'month' || window.mode === 'week')){
    renderMobileMonth();
  }
  else if(window.mode==='summary'){
    renderSummary();
  }
  else if(window.mode==='week'){
    renderWeek();
  }
  else if(window.mode==='instructors'){
    renderInstructors();
  }
  else{
    renderMonth();
  }

  updateNavButtons();
  updateModeButtons();

  if(window.mode === 'month'){
    goCalendar.style.display = 'none';
  } else {
    goCalendar.style.display = 'inline-flex';
  }
}

function renderMonth(){
  titleEl.textContent=currentDate.toLocaleString('he-IL',{month:'long',year:'numeric'});
  const data=applyFilters();
  const grid=document.createElement('div'); grid.className='grid';
  const y=currentDate.getFullYear(),m=currentDate.getMonth();
  const first=new Date(y,m,1),last=new Date(y,m+1,0);
  for(let i=0;i<first.getDay();i++) grid.appendChild(Object.assign(document.createElement('div'), {className:'day inactive'}));
  for(let d=1;d<=last.getDate();d++){ grid.appendChild(buildDay(new Date(y,m,d),data)); }
  view.appendChild(grid);
}

function renderWeek(){
  const s=new Date(currentDate); s.setDate(s.getDate()-s.getDay());
  const e=new Date(s); e.setDate(e.getDate()+6);
  titleEl.textContent=`${s.toLocaleDateString('he-IL')} – ${e.toLocaleDateString('he-IL')}`;
  const data=applyFilters();
  const grid=document.createElement('div'); grid.className='grid';
  for(let i=0;i<7;i++){
    const cur=new Date(s); cur.setDate(s.getDate()+i);
    grid.appendChild(buildDay(cur,data));
  }
  view.appendChild(grid);
}


function renderMobileMonth(){

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  titleEl.textContent =
    new Date(y,m,1).toLocaleString('he-IL',{month:'long',year:'numeric'});

  const data = applyFilters();

  const first = new Date(y,m,1);
  const last  = new Date(y,m+1,0);

  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  start.setHours(0,0,0,0);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '14px';
  container.style.padding = '10px';

  let cursor = new Date(start);

  while(cursor <= last){

    const weekStart = new Date(cursor);
    const weekEnd   = new Date(cursor);
    weekEnd.setDate(weekStart.getDate()+6);

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.borderRadius = '18px';
    box.style.padding = '16px';
    box.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
    box.style.cursor = 'pointer';

    box.innerHTML = `
      <div style="font-weight:800;font-size:15px;text-align:center">
        ${weekStart.toLocaleDateString('he-IL')} – ${weekEnd.toLocaleDateString('he-IL')}
      </div>
    `;

    box.onclick = ()=>{

      // אם כבר פתוח אותו שבוע → סגור
      if(
        mobileWeekOpen &&
        mobileWeekStart &&
        mobileWeekStart.getTime() === weekStart.getTime()
      ){
        mobileWeekOpen = false;
        mobileWeekStart = null;
        renderMobileMonth();
        return;
      }

      // אחרת → פתח
      mobileWeekOpen = true;
      mobileWeekStart = weekStart;

      renderMobileWeekDetail(weekStart, data);
    };

    container.appendChild(box);

    cursor.setDate(cursor.getDate()+7);
  }

  view.appendChild(container);
}

function renderMobileWeekDetail(weekStart, data){

  mobileWeekOpen = true;
  mobileWeekStart = weekStart;

  view.innerHTML='';

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate()+6);

  titleEl.textContent =
    `${weekStart.toLocaleDateString('he-IL')} – ${weekEnd.toLocaleDateString('he-IL')}`;

  const container = document.createElement('div');
  container.style.display='flex';
  container.style.flexDirection='column';
  container.style.gap='12px';
  container.style.padding='10px';

  for(let i=0;i<7;i++){
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate()+i);
    container.appendChild(buildDay(date,data));
  }

  view.appendChild(container);
}

function buildDay(date,data){
  const cell=document.createElement('div'); cell.className='day';
  cell.innerHTML=`<div class='day-header'>${date.getDate()}/${date.getMonth()+1} | ${dayNames[date.getDay()]}</div>`;
  if(sameDay(date, new Date())){
    cell.classList.add('today');
  }

  const dailyPool = [];
  data.forEach(r => r.Dates.forEach((dd, i) => {
    if(sameDay(dd, date)) dailyPool.push({ ...r, meetingIdx: i + 1 });
  }));

  const groupsMap = {};
  dailyPool.forEach(ev => {
    if(ev.EventType === 'HOLIDAY') {
      const key = `holiday-${ev.Program}`;
      if(!groupsMap[key]) groupsMap[key] = { type:'holiday', time: '00:00', items:[ev] };
    } else {
      const key = `${ev.Employee}-${ev.Program}`;
      if(!groupsMap[key]) groupsMap[key] = { type:'course', time: ev.StartTime || '99:99', items:[] };
      groupsMap[key].items.push(ev);
    }
  });

  const sortedGroups = Object.values(groupsMap).sort((a, b) => a.time.localeCompare(b.time));

  if(sortedGroups.length === 0) cell.classList.add('empty');

  sortedGroups.forEach(g => {
    const evDiv = document.createElement('div');
    const first = g.items[0];

    if(g.type === 'holiday') {
      evDiv.className = 'event'; evDiv.style.background = '#fee2e2';
      evDiv.innerHTML = `<strong>חג</strong> <div>${first.Program}</div>`;
    } else {
      const hasEmp = !!(first.Employee && first.Employee.trim());
      evDiv.className = 'event' + (!hasEmp ? ' missing' : '');
      evDiv.style.background = getEmployeeColor(first.Employee);

      const count = g.items.length > 1 ? `<span class="badge-count">x${g.items.length}</span>` : '';
      const hourStr = first.StartTime ? `<div class="event-hour">${first.StartTime}</div>` : '';
      const empName = hasEmp ? `<strong>${first.Employee}</strong>` : `<strong style="color:var(--danger)">חסר מדריך</strong>`;

      evDiv.innerHTML = `${count}${hourStr}${empName}<div>${first.Program}</div>`;
      evDiv.onclick = (e) => { e.stopPropagation(); openSideGrouped(g.items); };
    }
    cell.appendChild(evDiv);
  });
  return cell;
}

function openSideGrouped(items) {
  const first = items[0];
  sideContent.innerHTML = `
    <h2>${first.Program}</h2>
    <div class='subtitle'>מנהל: ${getManagerForCourseViews(first) || '—'}</div>
    <div style="border-top:1px solid var(--border); margin-top:10px; padding-top:10px;"></div>
  `;

  items.forEach(item => {
    const end = endDate(item);
    const timeRange = (item.StartTime || item.EndTime) ? `${item.StartTime} – ${item.EndTime}` : '—';
    const empDisplay = (item.Employee && item.Employee.trim()) ? item.Employee : `<span style="color:var(--danger); font-weight:bold;">חסר מדריך</span>`;

    sideContent.innerHTML += `
      <div class="group-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div class='badge'>מפגש ${item.meetingIdx}</div>
          <div style="background:#334155; color:#fff; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:bold;">${timeRange}</div>
        </div>
        <div class='row'><span class='label'>מדריך</span><span class='value'>${empDisplay}</span></div>
        <div class='row'><span class='label'>בית ספר</span><span class='value'>${item.School || '—'}</span></div>
        <div class='row'><span class='label'>רשות</span><span class='value'>${item.Authority || '—'}</span></div>
        <div class='row'><span class='label'>סיום קורס</span><span class='value'>${end ? end.toLocaleDateString('he-IL') : '—'}</span></div>
      </div>
    `;
  });
  side.classList.add('open');
}

function applyFilters(){
  return rawData.filter(r=>(!managerFilter.value||getManagerForCourseViews(r)===managerFilter.value)&&(!employeeFilter.value||r.Employee===employeeFilter.value));
}

function getCourseStartDate(r){
  if(!r.Dates || !r.Dates.length) return null;

  const validDates = r.Dates.filter(d => d);
  if(validDates.length === 0) return null;

  return new Date(Math.min(...validDates.map(d => d.getTime())));
}

function renderSummary(){
  const selectedValue = summaryMonth.value;

  let currentYear;
  let currentMonth;

  if(selectedValue){
    const [y,m] = selectedValue.split('-').map(Number);
    currentYear = y;
    currentMonth = m;
  } else {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
  }

  const currentMonthStart = new Date(currentYear, currentMonth, 1);

  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;

  if(nextMonth > 11){
    nextMonth = 0;
    nextYear++;
  }

  const courses = rawData.filter(isCourse);

  const activeThisMonth = rawData.filter(r => {
    if(String(r.EventType || '').trim().toUpperCase() !== 'COURSE')
      return false;

    return r.Dates.some(d =>
      d &&
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth
    );
  }).length;

  const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
  nextMonthStart.setHours(0,0,0,0);

  const startingFuture = rawData.filter(r => {
    if(String(r.EventType || '').trim().toUpperCase() !== 'COURSE')
      return false;

    const startDate = getCourseStartDate(r);
    if(!startDate) return false;

    startDate.setHours(0,0,0,0);

    return startDate >= nextMonthStart;
  }).length;

  const totalCourses = activeThisMonth + startingFuture;

  const missingInstructorCount = rawData.filter(r => {
    if(String(r.EventType || '').trim().toUpperCase() !== 'COURSE') return false;
    if(r.Employee && r.Employee.trim()) return false;
    return r.Dates.some(d => d && d.getFullYear() === currentYear && d.getMonth() === currentMonth);
  }).length;

  titleEl.textContent = currentMonthStart.toLocaleString('he-IL',{month:'long',year:'numeric'});

  const wrap = document.createElement('div'); wrap.className = 'summary-wrap';
  wrap.innerHTML = `
    <div class="summary-top">

      <div class="kpi-card">
        <div class="kpi-label">סה"כ קורסים פעילים</div>
        <div class="kpi-value">${totalCourses}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">פעילים החודש</div>
        <div class="kpi-value">${activeThisMonth}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">נפתחים בעתיד</div>
        <div class="kpi-value">${startingFuture}</div>
      </div>

      ${missingInstructorCount > 0 ? `
      <div class="kpi-card" style="border:2px solid #dc2626">
        <div class="kpi-label" style="color:#dc2626">קורסים ללא מדריך</div>
        <div class="kpi-value" style="color:#dc2626">${missingInstructorCount}</div>
      </div>` : ''}

    </div>
  `;

  const managers = [...new Set(courses.map(r=>getCourseManager(r)).filter(Boolean))];
  const split = document.createElement('div'); split.className = 'summary-split';

  managers.forEach(mgr=>{
    const mgrCourses = courses.filter(r=>getCourseManager(r) === mgr);
    const mgrActive = mgrCourses.filter(r =>
      isCourseActiveInMonth(r, currentYear, currentMonth)
    ).length;
    const mgrEndedThisMonth = mgrCourses.filter(r =>
      isCourseEndingInMonth(r, currentYear, currentMonth)
    ).sort((a,b)=>parseDate(a.End)-parseDate(b.End));

    const mgrMissingActive = mgrCourses.filter(r =>
      isCourseActiveInMonth(r, currentYear, currentMonth) &&
      (!r.Employee || !r.Employee.trim())
    );

    const col = document.createElement('div'); col.className = 'summary-col';
    col.innerHTML = `
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:13px;color:#64748b">קורסים פעילים</div>
        <div style="font-size:26px;font-weight:800">${mgrActive}</div>
      </div>
      <div class="manager-header" style="text-align:center; border-bottom:2px solid #f59e0b; margin-bottom:12px;"><h3>${mgr}</h3></div>
      <div class="summary-course-box">
        קורסים שמסתיימים החודש: ${mgrEndedThisMonth.length}
      </div>`;

    col.onclick = () => {
      document.querySelectorAll('.manager-overlay-bg, .manager-details-overlay')
        .forEach(el=>el.remove());

      const overlayBg = document.createElement('div');
      overlayBg.className = 'manager-overlay-bg';
      document.body.appendChild(overlayBg);

      const details = document.createElement('div');
      details.className = 'manager-details-overlay';

      details.innerHTML = `
        <h3>${mgr}</h3>
        ${mgrMissingActive.length > 0 ? `
          <div style="background:#fef2f2;border:1.5px solid #dc2626;border-radius:12px;padding:14px;margin-bottom:16px">
            <div style="font-weight:800;color:#dc2626;margin-bottom:10px">⚠ קורסים פעילים ללא מדריך: ${mgrMissingActive.length}</div>
            ${mgrMissingActive.map(r=>`
              <div style="font-size:13px;padding:5px 0;border-bottom:1px solid #fecaca">
                ${r.Program || '—'}${r.School ? ` · ${r.School}` : ''}
              </div>`).join('')}
          </div>` : ''}
        ${
          mgrEndedThisMonth.length
            ? mgrEndedThisMonth.map(r=>{
                const empName = (r.Employee && r.Employee.trim())
                  ? r.Employee
                  : `<span style="color:#dc2626;font-weight:700">חסר מדריך</span>`;

                return `
                  <div class="manager-course-card">
                    <div class="manager-course-title">${r.Program}</div>
                    <div class="manager-course-meta">
                      👤 מדריך: ${empName}<br>
                      🏫 בית ספר: ${r.School || '—'}<br>
                      🌍 רשות: ${r.Authority || '—'}<br>
                      📅 תאריך סיום: ${parseDate(r.End).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                `;
              }).join('')
            : '<div style="color:#94a3b8">אין קורסים המסתיימים החודש</div>'
        }
      `;

      document.body.appendChild(details);

      function closeManagerOverlay(){
        overlayBg.remove();
        details.remove();
      }
      overlayBg.onclick = closeManagerOverlay;
      overlayBg.addEventListener('touchend', e=>{ e.preventDefault(); closeManagerOverlay(); }, { passive: false });
    };

    split.appendChild(col);
  });
  wrap.appendChild(split); view.appendChild(wrap);
}

function getUniqueInstructorMonths(){
  const monthsMap = new Map();
  const minAllowed = getMinAllowedMonth();
  rawData.forEach(r=>{
    r.Dates.forEach(d=>{
      if(!d) return;
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month+1).padStart(2,'0')}`;
      if(!monthsMap.has(key)){
        monthsMap.set(key,{year,month});
      }
    });
  });

  return [...monthsMap.entries()]
    .sort((a,b)=>
      (a[1].year - b[1].year) ||
      (a[1].month - b[1].month)
    )
    .map(([,obj])=>obj)
    .filter(obj =>
      new Date(obj.year,obj.month,1) >= minAllowed
    )
    .map(({year,month})=>({
      value:`${year}-${String(month+1).padStart(2,'0')}`,
      label:new Date(year,month,1)
        .toLocaleDateString('he-IL',{month:'long',year:'numeric'})
    }));
}

function renderInstructors(){

  titleEl.textContent = "מדריכים";

  const managers=[...new Set(rawData.map(r=>getInstructorManager(r)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  const selectedManager = renderInstructors.selectedManager || '';

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.style.margin = '10px auto 0';
  controls.style.maxWidth = '1200px';

  const managerSelect = document.createElement('select');
  managerSelect.innerHTML = '<option value="">כל המנהלים</option>' + managers.map(v=>`<option value="${v}">${v}</option>`).join('');
  managerSelect.value = selectedManager;
  managerSelect.onchange = () => {
    renderInstructors.selectedManager = managerSelect.value;
    render();
  };
  controls.appendChild(managerSelect);

  const monthSelect = document.createElement('select');
  const monthOptions = getUniqueInstructorMonths();
  monthSelect.innerHTML = monthOptions
    .map(opt=>`<option value="${opt.value}">${opt.label}</option>`)
    .join('');

  const todayValue =
    `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`;

  if(!renderInstructors.selectedMonthValue){

    if(monthOptions.some(opt=>opt.value === todayValue)){
      renderInstructors.selectedMonthValue = todayValue;
    }
    else if(monthOptions.length > 0){
      renderInstructors.selectedMonthValue = monthOptions[0].value;
    }

  }

  monthSelect.value = renderInstructors.selectedMonthValue;
  monthSelect.onchange = () => {
    renderInstructors.selectedMonthValue = monthSelect.value;
    render();
  };
  controls.appendChild(monthSelect);

  view.appendChild(controls);

  let selectedMonth = currentDate.getMonth();
  let selectedYear = currentDate.getFullYear();

  const selectedMonthValue = renderInstructors.selectedMonthValue;

  const [y,m] = selectedMonthValue.split('-').map(Number);
  selectedYear = y;
  selectedMonth = m - 1;

  const instructorsMap = {};
  const missingInstructorCourses = [];
  const allActiveCourses = [];

  rawData.forEach(r => {
    if(!isCourse(r)) return;
    if(!isCourseActiveInMonth(r, selectedYear, selectedMonth)) return;

    if(selectedManager && getInstructorManager(r) !== selectedManager) return;

    allActiveCourses.push(r);

    if(!r.Employee || !r.Employee.trim()){
      missingInstructorCourses.push(r);
      return;
    }

    if(!instructorsMap[r.Employee]){
      instructorsMap[r.Employee] = [];
    }
    instructorsMap[r.Employee].push(r);
  });

  const names = Object.keys(instructorsMap)
    .sort((a,b)=> instructorsMap[b].length - instructorsMap[a].length || a.localeCompare(b,'he'));

  const totalCourses = allActiveCourses.length;

  const summaryHeader = document.createElement('div');
  summaryHeader.style.textAlign = 'center';
  summaryHeader.style.margin = '10px 0 20px 0';
  summaryHeader.style.fontSize = '16px';
  summaryHeader.style.fontWeight = '700';
  summaryHeader.style.lineHeight = '1.8';

  summaryHeader.innerHTML = `
    כמות מדריכים: ${names.length}<br>
    כמות קורסים: ${totalCourses}
    ${missingInstructorCourses.length > 0
      ? `<br><span style="color:#dc2626;font-weight:800">⚠ חסר מדריך: ${missingInstructorCourses.length} קורסים</span>`
      : ''}
  `;

  view.appendChild(summaryHeader);

  if(names.length===0 && missingInstructorCourses.length===0){
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '40px';
    empty.style.color = '#94a3b8';
    empty.textContent = 'לא נמצאו מדריכים פעילים';
    view.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(180px,1fr))';
  grid.style.gap = '16px';
  grid.style.maxWidth = '1200px';
  grid.style.margin = '20px auto';
  grid.style.padding = '10px';

  if(missingInstructorCourses.length > 0){
    const box = document.createElement('div');
    box.style.background = '#ffffff';
    box.style.border = '2px solid var(--danger)';
    box.style.borderRadius = '14px';
    box.style.padding = '16px';
    box.style.cursor = 'pointer';
    box.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.textAlign = 'center';
    box.style.minHeight = '140px';

    box.innerHTML = `
      <div style="font-weight:800;font-size:18px;margin-bottom:10px;color:var(--danger)">
        חסר מדריך
      </div>
      <div style="font-size:32px;font-weight:900;color:var(--danger)">
        ${missingInstructorCourses.length}
      </div>
      <div style="font-size:13px;color:#64748b;margin-top:6px">
        תוכניות פעילות
      </div>
    `;

    box.onclick = (e)=>{ e.stopPropagation(); openInstructorModal("חסר מדריך", missingInstructorCourses, selectedMonth, selectedYear); };

    grid.appendChild(box);
  }

  names.forEach(name=>{
    const box = document.createElement('div');
    box.style.background = getEmployeeColor(name);
    box.style.border = '1px solid var(--border)';
    box.style.borderRadius = '16px';
    box.style.padding = '14px';
    box.style.cursor = 'pointer';
    box.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
    box.style.transition = '0.2s';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.textAlign = 'center';
    box.style.minHeight = '140px';

    box.addEventListener('mouseenter', ()=>{ if(!window.matchMedia('(hover:none)').matches) box.style.transform='scale(1.03)'; });
    box.addEventListener('mouseleave', ()=>{ box.style.transform='scale(1)'; });

    box.innerHTML = `
      <div style="font-weight:800;font-size:18px;margin-bottom:10px">
        ${name}
      </div>
      <div style="font-size:32px;font-weight:900">
        ${instructorsMap[name].length}
      </div>
      <div style="font-size:13px;color:#475569;margin-top:6px">
        קורסים פעילים
      </div>
    `;

    box.onclick = (e)=>{ e.stopPropagation(); openInstructorModal(name, instructorsMap[name], selectedMonth, selectedYear); };

    grid.appendChild(box);
  });

  view.appendChild(grid);
}

function openInstructorModal(name, courses, selectedMonth, selectedYear){

  const month = selectedMonth ?? currentDate.getMonth();
  const year  = selectedYear ?? currentDate.getFullYear();

  let totalWorkDays = 0;

  function normalize(d){
    const n = new Date(d);
    n.setHours(0,0,0,0);
    return n;
  }

  const weeks = {};

  courses.forEach(r=>{

    if(!isCourse(r)) return;

    r.Dates.forEach(d=>{

      if(!d) return;

      const date = normalize(d);

      if(
        date.getFullYear() === selectedYear &&
        date.getMonth() === selectedMonth
      ){

        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0,0,0,0);

        const key = weekStart.toISOString();

        if(!weeks[key]){
          weeks[key] = new Set();
        }

        weeks[key].add(date.toDateString());
      }

    });

  });

  let maxDays = 0;

  Object.values(weeks).forEach(set=>{
    if(set.size > maxDays){
      maxDays = set.size;
    }
  });

  totalWorkDays = maxDays;
  const employmentType = courses[0]?.EmploymentType || '—';
  const managerName = getInstructorManager(courses[0]) || '—';

  sideContent.innerHTML = `
    <div class="instructor-header">
      <div class="instructor-name">${name}</div>
      <div class="instructor-badges">
        <span class="badge type">${employmentType}</span>
        <span class="badge days">${totalWorkDays} ימי עבודה בשבוע</span>
        <span class="badge courses">${courses.length} קורסים</span>
        <span class="badge">מנהל: ${managerName}</span>
      </div>
    </div>
  `;

  courses.forEach(r=>{

    const end = endDate(r);

    const startDate = r.Dates && r.Dates[0]
      ? r.Dates[0].toLocaleDateString('he-IL')
      : '—';

    const endDateFormatted = end
      ? end.toLocaleDateString('he-IL')
      : '—';

    sideContent.innerHTML += `
      <div class="course-card">

        <div style="
          font-weight:800;
          font-size:16px;
          padding:8px 12px;
          border-radius:10px;
          background:${getEmployeeColor(name)};
        ">
          ${r.Program || '—'}
        </div>

        <div>
          <span style="font-weight:700;color:#0f172a;">בית ספר:</span> ${r.School || '—'}<br>
          <span style="font-weight:700;color:#0f172a;">רשות:</span> ${r.Authority || '—'}
        </div>

        <div>
          <span style="font-weight:700;color:#0f172a;">
            תאריכי פעילות
          </span>
          (${startDate}) - (${endDateFormatted})
        </div>
      </div>
    `;
  });

  side.classList.add('open');
}

document.getElementById('prev').onclick = ()=>{
  enforceInstructorMode();
  if(!canGoPrev()) return;

  if(window.mode==='summary'){
    summaryMonth.selectedIndex = Math.max(0, summaryMonth.selectedIndex-1);
  }
  else if(window.mode==='week'){
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate()-7);

    if(temp >= getMinAllowedMonth()){
      currentDate = temp;
    }
  }
  else if(window.mode==='month'){
    const temp = new Date(currentDate);
    temp.setMonth(temp.getMonth()-1);

    if(temp >= getMinAllowedMonth()){
      currentDate = temp;
    }
  }

  render();
};
document.getElementById('next').onclick = ()=>{
  enforceInstructorMode();
  if(!canGoNext()) return;

  if(window.mode==='summary'){
    summaryMonth.selectedIndex = Math.min(summaryMonth.options.length-1, summaryMonth.selectedIndex+1);
  }
  else if(window.mode==='week'){
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate()+7);

    const weekStart = new Date(temp);
    weekStart.setDate(temp.getDate() - temp.getDay());
    weekStart.setHours(0,0,0,0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(0,0,0,0);

    if(dataRange && weekEnd >= dataRange.min && weekStart <= dataRange.max){
      currentDate = temp;
    }
  }
  else if(window.mode==='month'){
    const temp = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);

    if(dataRange){
      const maxMonth = new Date(dataRange.max.getFullYear(), dataRange.max.getMonth(), 1);
      if(temp <= maxMonth){
        currentDate = temp;
      }
    }
  }

  render();
};
btnMonth.onclick = ()=>{
  window.mode='month';
  currentDate = clampDateToDataRange(new Date());
  render();
};
btnWeek.onclick = ()=>{
  if(userRole === 'instructor') return;
  window.mode='week';
  currentDate = clampDateToDataRange(new Date());
  render();
};
btnSummary.onclick = ()=>{
  if(userRole === 'instructor') return;
  window.mode='summary';
  render();
};
btnInstructors.onclick = ()=>{
  if(userRole === 'instructor') return;
  window.mode='instructors';
  render();
};
goCalendar.onclick = ()=>{
  window.mode = 'month';
  currentDate = clampDateToDataRange(new Date());
  render();
};
document.getElementById('goToday').onclick = ()=>{
  const today = new Date();
  today.setHours(0,0,0,0);

  currentDate = clampDateToDataRange(today);

  if(window.mode === 'summary'){
    const key = `${today.getFullYear()}-${today.getMonth()}`;
    const options = [...summaryMonth.options].map(o=>o.value);
    const index = options.indexOf(key);
    if(index >= 0){
      summaryMonth.selectedIndex = index;
    }
  }

  if(window.mode === 'instructors'){
    renderInstructors.selectedMonthValue =
      `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  }

  render();
};
managerFilter.onchange=render;
employeeFilter.onchange=render;
document.getElementById('clearFilters').onclick=()=>{managerFilter.value='';employeeFilter.value='';render();};
summaryMonth.onchange=render;
document.getElementById('closeSide').onclick=()=>side.classList.remove('open');

document.addEventListener('click', (e)=>{
  if(side.classList.contains('open') && !side.contains(e.target)){
    side.classList.remove('open');
  }
});

/* ===== סגירת פאנל בהחלקה (swipe) במובייל ===== */
(function(){
  let _tx = 0, _ty = 0;
  side.addEventListener('touchstart', e=>{
    _tx = e.touches[0].clientX;
    _ty = e.touches[0].clientY;
  }, { passive: true });
  side.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX - _tx;
    const dy = Math.abs(e.changedTouches[0].clientY - _ty);
    // החלקה שמאלה (סגירה) — לפחות 60px ואופקית יותר מאנכית
    if(dx < -60 && dy < Math.abs(dx) * 0.8){
      side.classList.remove('open');
    }
  }, { passive: true });
})();

initFromRawData();

window.addEventListener('popstate', (e)=>{
  const isMobile = window.innerWidth < 800;
  if(isMobile && (window.mode === 'month' || window.mode === 'week')){
    side.classList.remove('open');
    view.innerHTML = '';
    renderMobileMonth();
  }
});

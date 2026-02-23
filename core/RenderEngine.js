export function renderSuggestions(list){
  const ul = document.getElementById('resultsList');
  ul.innerHTML = '';

  if (!list.length) {
    ul.innerHTML = '<li class="muted">לא נמצאו שיבוצים מתאימים בטווח (מהיום +7 ועד היום +60, א׳–ה׳).</li>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  list.forEach((c, index) => {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="item-header">
        <div>
          <div class="result-date">${medals[index] || '🏅'} ${c.name}</div>
          <div class="item-sub">${c.dateISO} | ${c.start}–${c.end}</div>
        </div>
      </div>
      <div class="options">
        <span class="opt">מרחק: ${c.distHome.toFixed(1)} ק"מ</span>
        <span class="opt">זמן נסיעה: ${Math.round(c.daily.travelMin)} דק׳</span>
        <span class="opt">אירועים היום: ${c.daily.eventsCount}</span>
        <span class="opt">עומס שבועי: ${c.weekly.workDays}</span>
        <span class="opt">עומס חודשי: ${c.monthly.coursesCount}</span>
        <span class="opt">עומס עתידי: ${c.future.futureCourses}/${c.future.futureWorkDays}</span>
        <span class="opt">ציון: ${c.score}</span>
        <span class="opt">איכות: ${c.quality}</span>
      </div>
    `;
    ul.appendChild(li);
  });
}

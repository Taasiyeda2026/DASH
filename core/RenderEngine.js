export function renderResults(list){
  const medals = ['🥇', '🥈', '🥉'];
  const container = document.getElementById('resultsList');
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = '<div class="muted">לא נמצאו שיבוצים מתאימים בטווח (מהיום +7 ועד היום +60, א׳–ה׳).</div>';
    return;
  }

  list.forEach((c, i) => {
    const medal = medals[i] || '•';

    const card = document.createElement('div');
    card.className = 'result-card';

    card.innerHTML = `
      <div style="font-weight:600;">
        ${medal} ${c.name}
      </div>
      <div style="color:#555;">
        ${c.dateISO || c.date} | ${c.start}–${c.end}
      </div>
      <div style="font-weight:600;">
        ${Number(c.distHome).toFixed(1)} ק"מ
      </div>
    `;

    container.appendChild(card);
  });
}

export const renderSuggestions = renderResults;

// ========================
// המרות תאריכים ושעות
// ========================

function excelDateToJSDate(serial) {
  return new Date((Number(serial) - 25569) * 86400 * 1000);
}

function formatTime(excelTime) {
  const totalMinutes = Math.round(Number(excelTime) * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
}

// ========================
// שליפת תאריכים מתוך Date1–Date16
// ========================

function extractDates(course) {
  const dates = [];

  for (let i = 1; i <= 16; i++) {
    const key = `Date${i}`;
    if (course[key]) {
      dates.push(course[key]);
    }
  }

  return dates;
}

// ========================
// טעינת דשבורד
// ========================

function loadDashboard() {

  const container = document.getElementById("content");
  container.innerHTML = "";

  if (!rawData || rawData.length === 0) {
    container.innerHTML = "<div style='padding:20px'>אין נתונים להצגה</div>";
    return;
  }

  rawData.forEach(course => {

    const card = document.createElement("div");
    card.style.cssText = `
      background:white;
      border-radius:12px;
      padding:16px;
      margin-bottom:12px;
      box-shadow:0 2px 6px rgba(0,0,0,0.08)
    `;

    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.marginBottom = "8px";
    title.textContent = course.Program;
    card.appendChild(title);

    const school = document.createElement("div");
    school.textContent = `בית ספר: ${course.School}`;
    card.appendChild(school);

    const authority = document.createElement("div");
    authority.textContent = `רשות: ${course.Authority}`;
    card.appendChild(authority);

    const manager = document.createElement("div");
    manager.textContent = `מנהל: ${course.Manager}`;
    card.appendChild(manager);

    const time = document.createElement("div");
    time.textContent =
      `שעות: ${formatTime(course.StartTime)} - ${formatTime(course.EndTime)}`;
    card.appendChild(time);

    // ========================
    // תאריכים
    // ========================

    const dates = extractDates(course);

    if (dates.length > 0) {

      const datesDiv = document.createElement("div");
      datesDiv.style.marginTop = "8px";
      datesDiv.style.fontSize = "14px";

      const sortedDates = dates
        .map(d => excelDateToJSDate(d))
        .sort((a,b)=>a-b);

      sortedDates.forEach(d => {
        const span = document.createElement("div");
        span.textContent = d.toLocaleDateString("he-IL");
        datesDiv.appendChild(span);
      });

      card.appendChild(datesDiv);
    }

    container.appendChild(card);

  });

}

// ========================
// המרות תאריכים ושעות (מתוקן)
// ========================

function excelDateToJSDate(serial) {

  if (!serial || isNaN(serial)) return null;

  // Excel epoch
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const msPerDay = 86400000;

  const date = new Date(excelEpoch.getTime() + serial * msPerDay);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

function formatTime(excelTime) {

  if (excelTime === null || excelTime === undefined) return "";

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
    if (course[key] && !isNaN(course[key])) {
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

    // כותרת תוכנית
    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.marginBottom = "8px";
    title.textContent = course.Program;
    card.appendChild(title);

    // בית ספר
    const school = document.createElement("div");
    school.textContent = `בית ספר: ${course.School}`;
    card.appendChild(school);

    // רשות
    const authority = document.createElement("div");
    authority.textContent = `רשות: ${course.Authority}`;
    card.appendChild(authority);

    // מנהל
    const manager = document.createElement("div");
    manager.textContent = `מנהל: ${course.Manager}`;
    card.appendChild(manager);

    // שעות
    const time = document.createElement("div");
    time.textContent =
      `שעות: ${formatTime(course.StartTime)} - ${formatTime(course.EndTime)}`;
    card.appendChild(time);

    // ========================
    // תאריכים
    // ========================

    const dates = course.Dates && course.Dates.length > 0
      ? course.Dates
      : extractDates(course);

    if (dates.length > 0) {

      const datesDiv = document.createElement("div");
      datesDiv.style.marginTop = "8px";
      datesDiv.style.fontSize = "14px";

      const sortedDates = dates
        .map(d => excelDateToJSDate(d))
        .filter(d => d !== null)
        .sort((a, b) => a - b);

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

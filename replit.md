# דשבורד פעילויות

## תיאור
אתר סטטי (HTML/CSS/JavaScript) לניהול ותצוגת דשבורד פעילויות. כל התקשורת והתיעוד בעברית בלבד.

## מבנה הפרויקט
- `index.html` — עמוד ראשי + כל ה-CSS
- `app.js` — ניהול כניסה (Login), אימות משתמש, טעינת נתונים
- `dashboard.js` — לוגיקת התצוגות (חודש, שבוע, סיכום, מדריכים, תאריכי סיום)
- `feature-flags.js` — דגלי פיצ'רים
- `server.js` — שרת סטטי פשוט (Node.js, פורט 5000)
- `data/` — תיקיית נתונים (admins, instructors, scheduling)

## מבנה ה-Layout (CSS)
```
html (overflow: hidden, overflow-x: hidden, overscroll-behavior: none)
body (flex column, 100vh, overflow: hidden, overflow-x: hidden, overscroll-behavior: none)
  └── #app-wrapper (flex column, height: 100%, overflow: hidden, max-width: 100%)
       └── #app (flex column, height: 100%, overflow: hidden, max-width: 100%)
            ├── .mobile-sticky-wrapper (flex-shrink: 0)
            │     ├── header
            │     └── .nav
            ├── #filters (flex-shrink: 0)
            └── #view (flex: 1, overflow-y: auto, overflow-x: hidden, min-height: 0)
```
- הגלילה מתרחשת רק בתוך `#view`
- ה-header וה-nav נשארים קבועים למעלה
- `#view` מוגדר כ-flex column עם `align-items: center` למרכוז תוכן
- כל מעבר בין תצוגות מאפס `view.scrollTop = 0`
- פתיחת פאנל צד/day sheet מאפסת `scrollTop = 0` של התוכן

## תצוגות
1. **חודש** — דסקטופ: רשת 7 עמודות. מובייל: אקורדיון שבועי (כל השבועות סגורים, לחיצה פותחת)
2. **שבוע** — דסקטופ: רשת 7 עמודות. מובייל: ימים קומפקטיים בעמודה (ריקים מוסתרים)
3. **סיכום** — KPI, מנהלים, חסרי מדריך
4. **מדריכים** — דסקטופ: לוח שנה קומפקטי. מובייל: רשת 3 עמודות ריבועים קטנים, לחיצה פותחת bottom sheet מלא
5. **תאריכי סיום** — טבלת תאריכי סיום קורסים

## תצוגת מובייל — אקורדיון
- `renderMobileMonthAccordion()` — פונקציה משותפת למנהלים ומדריכים
- כל שבוע מוצג ככותרת עם טווח תאריכים בלבד
- כל השבועות סגורים בהתחלה, השבוע הנוכחי מודגש בכחול
- לחיצה על כותרת שבוע סוגרת את הפתוח ופותחת את הנלחץ
- ימים מרונדרים ע"י `buildDay()` (עצל — רק בפתיחה)
- CSS: `.mobile-accordion`, `.accordion-week`, `.accordion-header`, `.accordion-content`

## פאנל מדריכים (side panel)
- כרטיסי קורסים משתמשים ב-class `.course-title` (לא inline styles)
- במובייל: font-size, padding מוקטנים דרך media query
- הפאנל נפתח תמיד מלמעלה (scrollTop = 0)

## Workflow
- `Start application` — `node server.js` (פורט 5000)

## הערות טכניות
- אין build process — קבצים סטטיים בלבד
- הכניסה מבוססת hash (SHA-256) של מספר עובד + קוד אישי
- נתוני משתמשים בתיקיות `data/admins/` ו-`data/instructors/`

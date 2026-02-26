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
html, body (flex column, 100vh, overflow: hidden)
  └── #app-wrapper (flex column, height: 100%, overflow: hidden)
       └── #app (flex column, height: 100%, overflow: hidden)
            ├── .mobile-sticky-wrapper (flex-shrink: 0)
            │     ├── header
            │     └── .nav
            ├── #filters (flex-shrink: 0)
            └── #view (flex: 1, overflow-y: auto, min-height: 0)
```
- הגלילה מתרחשת רק בתוך `#view`
- ה-header וה-nav נשארים קבועים למעלה
- `#view` מוגדר כ-flex column עם `align-items: center` למרכוז תוכן

## תצוגות
1. **חודש** — דסקטופ: רשת 7 עמודות עם כרטיסי ימים. מובייל: אקורדיון שבועי (שבוע נוכחי פתוח, לחיצה פותחת/סוגרת)
2. **שבוע** — רשת 7 עמודות לשבוע הנוכחי
3. **סיכום** — KPI, מנהלים (גיל-ירוק, לינוי-סגול), חסרי מדריך
4. **מדריכים** — דסקטופ: לוח שנה קומפקטי. מובייל: אקורדיון שבועי (כמו מנהלים)
5. **תאריכי סיום** — טבלת תאריכי סיום קורסים

## תצוגת מובייל — אקורדיון
- `renderMobileMonthAccordion()` — פונקציה משותפת למנהלים ומדריכים
- כל שבוע מוצג ככותרת עם טווח תאריכים + מספר פעילויות
- השבוע הנוכחי נפתח אוטומטית, מודגש בכחול
- לחיצה על כותרת שבוע סוגרת את הפתוח ופותחת את הנלחץ
- ימים מרונדרים ע"י `buildDay()` (עצל — רק בפתיחה)
- CSS בקלאסים: `.mobile-accordion`, `.accordion-week`, `.accordion-header`, `.accordion-content`
- גלילה מתבצעת בתוך `#view` (לא window) כדי שההידר יישאר קבוע

## Workflow
- `Start application` — `node server.js` (פורט 5000)

## הערות טכניות
- אין build process — קבצים סטטיים בלבד
- הכניסה מבוססת hash (SHA-256) של מספר עובד + קוד אישי
- נתוני משתמשים בתיקיות `data/admins/` ו-`data/instructors/`

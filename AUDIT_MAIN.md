# Code Audit – MAIN Scope (interpreted as repository root)

## Note
לא נמצאה תיקייה בשם `MAIN` בריפו, לכן הבדיקה בוצעה על כלל קבצי הפרויקט תחת `/workspace/DASH`.

## System map (high level)
- Entry points:
  - `server.js` serves `index.html` for `/`.
  - `index.html` loads `feature-flags.js` and `app.js`.
  - `app.js` dynamically injects `dashboard.js` after successful login.
  - `scheduling.html` is a guard page that redirects to `schedulingsystem.html`.
  - `schedulingsystem.html` loads `scheduling-app.js` (module).
- Scheduling module graph:
  - `scheduling-app.js` imports `core/RecommendationEngine.js` and `core/RenderEngine.js`.
- Dynamic usage scan performed for: `window[]`, `eval`, `import()`, string-based file references.
  - No `window[]`, no `eval`, no `import()` dynamic imports were found in app code.
  - One string-based JS reference exists: `app.js` sets `script.src = 'dashboard.js'`.

## Deletion recommendation table
| קובץ | סוג בעיה | למה ניתן למחוק / לנקות | רמת ביטחון |
|---|---|---|---|
| `core/DateUtils.js` | Unused File | מיובא רק ע"י `core/LoadEngine.js`/`core/FutureEngine.js`, ושני הקבצים הללו אינם מיובאים משום Entry Point. | גבוה |
| `core/LoadEngine.js` | Unused File | לא מיובא ולא נקרא משום קובץ נטען (`index.html`/`schedulingsystem.html`). | גבוה |
| `core/FutureEngine.js` | Unused File | לא מחובר לגרף הטעינה של המערכת בפועל. | גבוה |
| `core/GeoUtils.js` | Unused File | מיובא רק ע"י `core/TravelEngine.js`, שגם הוא לא מיובא בשום מקום. | גבוה |
| `core/TravelEngine.js` | Unused File | לא מחובר ל-`scheduling-app.js` או ל-`dashboard.js`. | גבוה |
| `core/HardRulesEngine.js` | Unused File | אינו מיובא משום קובץ פעיל. | גבוה |
| `core/ScoringEngine.js` | Unused File | אינו מיובא משום קובץ פעיל. | גבוה |
| `core/ExplainabilityEngine.js` | Unused File | אינו מיובא משום קובץ פעיל. | גבוה |
| `style.css` | Unused CSS | לא מקושר באף HTML; מכיל רק הערה ללא כללי CSS פעילים. | גבוה |
| `attached_assets/image_1772104834638.png` | Unused File | לא נמצא רפרנס לקובץ בפרויקט. נראה כקובץ צמוד/ארטיפקט. | בינוני |
| `attached_assets/IMG_4298_1772126034336.png` | Unused File | לא נמצא רפרנס לקובץ בפרויקט. נראה כקובץ צמוד/ארטיפקט. | בינוני |
| `attached_assets/image_1772104146211.png` | Unused File | לא נמצא רפרנס לקובץ בפרויקט. נראה כקובץ צמוד/ארטיפקט. | בינוני |
| `attached_assets/IMG_4297_1772125877856.png` | Unused File | לא נמצא רפרנס לקובץ בפרויקט. נראה כקובץ צמוד/ארטיפקט. | בינוני |
| `scheduling-app.js` (`export` functions) | Dead Code | הפונקציות `renderCoursesTableFromLast`, `runSuggestions`, `goBackToDashboard` מיוצאות אך אין מודול שמייבא אותן. אפשר להסיר `export` או להשאיר לשימוש עתידי. | בינוני |
| `core/RecommendationEngine.js` | Duplicate Logic | מכיל utilities כפולים (תאריכים/Geo/time parsing) שקיימים גם בקבצים ייעודיים (`DateUtils.js`, `GeoUtils.js`) – מעיד על לוגיקה כפולה. | בינוני |

## Critical – Do Not Delete
| קובץ | סיבה |
|---|---|
| `server.js` | נקודת הגשה (entry) של השרת הסטטי המקומי. |
| `index.html` | Entry UI ראשי של המערכת. |
| `app.js` | Authentication + bootstrap + טעינת `dashboard.js`. |
| `dashboard.js` | לוגיקת הדשבורד בפועל. |
| `feature-flags.js` | נבדק/נטען בעמודים מרכזיים ומשפיע ניתוב/גישה. |
| `scheduling.html` | Guard page עם בדיקות הרשאה וניתוב. |
| `schedulingsystem.html` | Entry page של מודול השיבוץ. |
| `scheduling-app.js` | Entry JS של מודול השיבוץ (למרות שיש בו exports מיותרים). |
| `core/RecommendationEngine.js` | מנוע ההמלצות שבשימוש ישיר. |
| `core/RenderEngine.js` | רינדור תוצאות השיבוץ בשימוש ישיר. |
| `data/**` | נתוני runtime (admins/instructors/scheduling/notes). מחיקה תשבור את המערכת. |
| `manifest.json`, `icon-192.png`, `icon-512.png`, `logo.png`, `icon-*.svg` | קבצי PWA/מותג/אייקונים בשימוש ישיר מה-HTML/manifest. |

## Files named as legacy patterns
לא נמצאו שמות קבצים תואמי `old|backup|copy|test|temp|v1|draft`.

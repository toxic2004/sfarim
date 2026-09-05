# ספרים למכירה

קטלוג ציבורי של 44 ספרים למכירה, עם כריכות, מחירים, חיפוש, סינון וזמינות.

מסך הניהול ב־`/admin` מאפשר לעדכן מחיר וזמינות. הנתונים נשמרים ב־Supabase ומוצגים מיד בקטלוג.

## פריסה

המאגר מיועד ל־Cloudflare Worker בשם `sfarim` באמצעות Workers Builds.

הגדרות מומלצות:

* Production branch: `master`
* Build command: להשאיר ריק
* Deploy command: `npx wrangler deploy`
* Root directory: `/`

הקבצים הציבוריים נמצאים בתיקייה `public`.

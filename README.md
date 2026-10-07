# نظام متابعة الطلاب

تطبيق ويب (Next.js + PostgreSQL + Drizzle + Tailwind) لمتابعة طلاب الصف الثالث الابتدائي.

## النشر على Railway

1. أنشئ مشروعًا جديدًا على Railway، وأضف خدمة من مستودع GitHub هذا.
2. أضف قاعدة بيانات PostgreSQL للمشروع (New → Database → PostgreSQL).
3. في متغيّرات الخدمة (Variables) أضف:
   - `DATABASE_URL` = رابط اتصال قاعدة Postgres (من Railway).
   - `AUTH_PASSWORD` = كلمة مرور الدخول.
   - `AUTH_SECRET` = نص سرّي طويل عشوائي.
4. بعد أول نشر، شغّل مرة واحدة من طرفية الخدمة:
   - `npm run db:push`  (لإنشاء الجداول)
   - `npm run db:seed scripts/seed_students.json`  (لاستيراد الطلاب)

## التطوير محليًا

```bash
npm install
npm run db:push
npm run db:seed scripts/seed_students.json
npm run dev
```

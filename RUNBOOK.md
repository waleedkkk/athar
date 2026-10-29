# دليل تشغيل ونشر متجر أثر (ATHAR Operations Runbook)

## روابط الوصول الحية (Production Live URLs)
- **المتجر الإلكتروني (Storefront)**: [https://atharr.duckdns.org](https://atharr.duckdns.org)
- **لوحة التحكم (Medusa Admin Dashboard)**: [https://atharr.duckdns.org/app](https://atharr.duckdns.org/app)
- **بيانات تسجيل دخول الإدارة الافتراضية للتطوير**:
  - البريد: `admin@athar.local`
  - كلمة المرور: `AtharDev!2026`

---

## البنية التحتية والشبكة (Architecture)
- **نظام الحاويات (Docker Compose)**:
  - `athar-backend-1`: Medusa v2.22.1 API + Admin (منفذ داخلي 9000) — صورة الإنتاج `athar-backend:latest`.
  - `athar-storefront-1`: Next.js 16 Storefront (منفذ داخلي 8000) — صورة الإنتاج `athar-storefront:latest`.
  - `athar-postgres-1`: PostgreSQL 16 قاعدة بيانات `athar`.
  - `athar-redis-1`: Redis 7 للكاش والأحداث.
- **وضع التشغيل الحالي**: النطاق العام `https://atharr.duckdns.org` يخدمه **تكديس الإنتاج** (Production Stack):
  - `docker-compose.prod.yml` + `apps/backend/Dockerfile` + `apps/storefront/Dockerfile`.
  - الباك إند يعمل بأمر `medusa start` من داخل `.medusa/server` (المخرج المجمّع لـ `medusa build`).
  - المتجر يعمل بأمر `next start -p 8000` على مخرجات `next build`.
  - الحاويات تُنشر على نفس منافذ المضيف (9000 و 8000) لذلك يبقى إعداد Nginx دون تغيير.
- **خادم الويب والتوجيه (Host Nginx)**:
  - ملف التكوين: `/etc/nginx/sites-available/atharr.duckdns.org`
  - التوجيه:
    - `/` → المتجر الأمامي (`http://127.0.0.1:8000`)
    - `/app` و `/admin` و `/auth/` → الباك إند ولوحة التحكم (`http://127.0.0.1:9000`)
  - التشفير: شهادة SSL صادرة عبر Let's Encrypt / Certbot وتتجدد تلقائياً.
- **ملفات البيئة (غير مدرجة في Git)**:
  - `apps/backend/.env.production`: إعدادات الإنتاج (قاعدة البيانات `athar` مع `?sslmode=disable`، Redis، نطاقات CORS العامة، `JWT_SECRET` و `COOKIE_SECRET`).
  - `apps/storefront/.env.local`: مفاتيح `NEXT_PUBLIC_*` (تُدمج أثناء البناء).

---

## بوابات الدفع المصرية المفعلة
1. **الدفع عند الاستلام (COD)**: `pp_cash-on-delivery_cod`
2. **إنستاباي (InstaPay)**: `pp_instapay_instapay` (حساب: `athar@instapay`)
3. **فودافون كاش / محافظ إلكترونية**: `pp_vodafone-cash_vodafone` (رقم: `01000000000`)

---

## أوامر الصيانة الشائعة (Maintenance Commands)

### 0. تكديس الإنتاج (Production Stack) — الأوامر الأساسية:
```bash
# بناء الصور (من مستودع الجذر، يستغرق عدة دقائق)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# تشغيل / إعادة تشغيل الإنتاج
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# إعادة تشغيل الحاويات فقط
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend storefront

# إيقاف الإنتاج والرجوع إلى وضع التطوير (Rollback)
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend storefront
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```
- **ملاحظة**: عند تعديل أي متغير يبدأ بـ `NEXT_PUBLIC_` يجب إعادة بناء صورة المتجر (它们 تُدمج وقت البناء):
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build storefront
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d storefront
```

### 1. إعادة تشغيل خدمات التطوير (Development Stack):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

### 2. متابعة السجلات (Logs):
```bash
docker logs -f athar-backend-1
docker logs -f athar-storefront-1
```

### 3. إعادة فحص واختبار Nginx:
```bash
nginx -t && systemctl reload nginx
```

### 4. تعديل إعدادات Nginx على الخادم:
```bash
docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -i -n -p -- sh -c 'vi /etc/nginx/sites-available/atharr.duckdns.org && nginx -t && systemctl reload nginx'
```

---

## مشاكل شائعة وحلولها (Known Issues)

### تعطّل التفاعل في المتجر بعد التثبيت عبر Nginx (المتجر لا يستجيب للنقر)
- **السبب**: خادم Next.js في **وضع التطوير** يرفض طلبات HMR/WebSocket قادمة من النطاق العام، فتفشل عملية الترطيب (hydration) ويصبح المتجر غير تفاعلي دون أي رسالة خطأ ظاهرة.
- **الحل**: إضافة النطاق العام إلى `allowedDevOrigins` في `apps/storefront/next.config.js` ثم إعادة تشغيل حاوية المتجر:
```bash
docker restart athar-storefront-1
```
- **ملاحظة**: هذا خاص بوضع التطوير فقط؛ في وضع الإنتاج لا توجد اتصالات HMR.

### فشل بناء صورة الباك إند بسبب أخطاء TypeScript
- **السبب**: `medusa build` (أمر البناء الإنتاجي) performs a full type-check، بخلاف `medusa develop` الذي لا يفحص الأنواع. أي خطأ TypeScript في `apps/backend/src` يوقف البناء.
- **الحل**: فحص الأنواع قبل البناء:
```bash
docker run --rm -v /root/opencode-docker/workspace/ATHAR:/app -w /app/apps/backend athar-dev:latest \
  sh -lc 'corepack enable && pnpm exec tsc --noEmit -p tsconfig.json'
```

### ظهور بيانات قديمة بعد تعديل قاعدة البيانات مباشرة (مثل أسماء التصنيفات)
- **السبب**: المتجر يستخدم `cache: "force-cache"`، فتُخزّن بيانات الكتالوج في كاش Next.js.
- **الحل (وضع التطوير)**: مسح كاش الجلب ثم إعادة تشغيل المتجر:
```bash
docker exec athar-storefront-1 sh -lc 'rm -rf /app/apps/storefront/.next/dev/cache/fetch-cache/*'
docker restart athar-storefront-1
```
- **الحل (وضع الإنتاج)**: إعادة بناء صورة المتجر هي الأنسب (الكاش داخل الصورة):
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build storefront
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d storefront
```

### رسائل 404 في المتصفح على طلبات Prefetch (`?_rsc=...`) في وضع الإنتاج
- **السبب**: طلبات Prefetch الخاصة بـ React Server Components تُعاد توجيهها مرة واحدة (307) من وسيط Medusa، وبعض المتصفحات تسجّل 404 في وحدة التحكم.
- **الأثر**: غير مؤثر — فتح الصفحات والتنقل وعملية الشراء تعمل بشكل صحيح؛ الطلب يعيد 200 عند المتابعة.

### تحذير "Local Event Bus installed. This is not recommended for production"
- **السبب**: إعداد المشروع لا يحدد وحدة ناقل الأحداث، فيستخدم Medusa ناقل الأحداث المحلي افتراضياً.
- **الأثر**: مقبول مع تشغيل نسخة واحدة (Single Instance)؛ عند التوسع لعدة نسخ يجب ضبط Redis Event Bus في `medusa-config.ts`.

---

## اختبار الشراء الحقيقي (Live Checkout Test)
- تم تنفيذ عمليات شراء كاملة بنجاح عبر `https://atharr.duckdns.org`:
  - الطلب رقم 1: `order_01M64GA6NSK7KN04R2FBVS8C27` — الإجمالي 1,520 EGP (3 قطع + شحن القاهرة والجيزة 50 EGP) — الدفع عند الاستلام (وضع التطوير).
  - الطلب رقم 2: `order_01M64N4208S19TS4MBFVHKWQ1R` — الإجمالي 540 EGP (قطعة واحدة + شحن) — الدفع عند الاستلام (وضع التطوير).
  - الطلب رقم 3: `order_01M64YBJZAH786T6JPJCDKCK69` — الإجمالي 540 EGP (قطعة واحدة + شحن القاهرة والجيزة 50 EGP) — الدفع عند الاستلام (**وضع الإنتاج**، جلسة الدفع `payses_01M64YB72QGJBC4JAWWSB4CFN1` بحالة `authorized`).
- التحقق من الطلبات يتم مباشرة في قاعدة البيانات:
```bash
docker exec athar-postgres-1 psql -U medusa -d athar -c "select id, display_id, status, currency_code, email, created_at from \"order\" order by created_at desc limit 5;"
docker exec athar-postgres-1 psql -U medusa -d athar -c "select id, provider_id, status, amount, currency_code from payment_session order by created_at desc limit 5;"
```

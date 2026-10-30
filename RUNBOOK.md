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
    - `/store` → واجهة المتجر البرمجية للـAPI (`http://127.0.0.1:9000`) — ضرورية لأن المتصفح يستدعي `/store/*` عبر SDK.
    - `/app` و `/admin` و `/auth/` → الباك إند ولوحة التحكم (`http://127.0.0.1:9000`)
  - التشفير: شهادة SSL صادرة عبر Let's Encrypt / Certbot وتتجدد تلقائياً.
- **ملفات البيئة (غير مدرجة في Git)**:
  - `apps/backend/.env.production`: إعدادات الإنتاج (قاعدة البيانات `athar` مع `?sslmode=disable`، Redis، نطاقات CORS العامة، `JWT_SECRET` و `COOKIE_SECRET`). الملف غير مدرج في Git (القاعدة `**/.env.production` في `.gitignore`) ويجب إنشاؤه على أي خادم جديد.
  - مفاتيح `NEXT_PUBLIC_*` الخاصة ببناء الإنتاج موجودة في `docker-compose.prod.yml` ضمن `build.args` (وهي تُدمج في حزمة المتصفح وقت البناء، لذلك أي تغيير يتطلب إعادة بناء الصورة).

---

## بوابات الدفع المصرية المفعلة
1. **الدفع عند الاستلام (COD)**: `pp_cash-on-delivery_cod`
2. **إنستاباي (InstaPay)**: `pp_instapay_instapay` (حساب: `athar@instapay`)
3. **فودافون كاش / محافظ إلكترونية**: `pp_vodafone-cash_vodafone` (رقم: `01000000000`)

---

## أوامر الصيانة الشائعة (Maintenance Commands)

### 0. تكديس الإنتاج (Production Stack) — الأوامر الأساسية:
```bash
# 1) بناء صورة الباك إند ثم صورة المتجر (顺序 متسلسل — لا تُبنَImages معاً لتفادي استهلاك الذاكرة)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml build storefront

# 2) إيقاف حاويات التطوير (لأنها تشغل نفس المنافذ 9000/8000)
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop backend storefront

# 3) تشغيل الإنتاج
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4) إعادة تشغيل الحاويات فقط (بدون rereading للبيئة)
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend storefront

# 5) إعادة إنشاء الحاويات (مطلوب بعد تعديل apps/backend/.env.production — restart لا يعيد قراءة env_file)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend

# 6) إيقاف الإنتاج والرجوع إلى وضع التطوير (Rollback)
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend storefront
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```
- **متطلبات البناء**: بناء صورة المتجر يحتاج (أ) متغيرات البناء في `docker-compose.prod.yml`، و(ب) **باك إند يعمل على منفذ 9000** لأن `next build` يولّد مسبقاً صفحات تسحب بيانات من الـAPI. حدّ الذاكرة `NODE_OPTIONS=--max-old-space-size=3072` مضبوط داخل الصورة؛ يُنصح ببناء الصور تباعاً.
- **ملاحظة**: عند تعديل أي متغير يبدأ بـ `NEXT_PUBLIC_` يجب إعادة بناء صورة المتجر (تُدمج وقت البناء):
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build storefront
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d storefront
```

### 1. إعادة تشغيل خدمات التطوير (Development Stack):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

### 1.b بناء صورة التطوير المستخدمة في التطوير والرجوع (Rollback):
```bash
docker build -f Dockerfile.dev -t athar-dev:latest .
```

### 1.c تطبيق ترحيلات قاعدة البيانات (بعد أي تغيير في نماذج البيانات):
```bash
# يعمل من داخل حاوية الباك إند (مسار المشروع المجمّع)
docker exec athar-backend-1 sh -lc 'cd /app/deploy/backend/.medusa/server && /app/deploy/backend/node_modules/.bin/medusa db:migrate'
```
- **ملاحظة**: سكربت البيانات الأولية `initial-data-seed` أصبح آمناً للتكرار: إذا كانت هناك منطقة (region) موجودة مسبقاً فإنه يتخطّى التعبئة بدل الفشل. بعد أي ترحيل جديد يجب تشغيل الأمر أعلاه ثم إعادة تشغيل حاوية الباك إند.

### 1.d إنشاء ملف بيئة الإنتاج على خادم جديد:
```bash
# القيم المطلوبة في apps/backend/.env.production (غير مدرج في Git):
# NODE_ENV=production
# DATABASE_URL=postgres://medusa:medusa@postgres:5432/athar?sslmode=disable
# REDIS_URL=redis://redis:6379
# STORE_CORS=https://atharr.duckdns.org,http://localhost:8000,http://127.0.0.1:8000
# ADMIN_CORS=https://atharr.duckdns.org,http://localhost:9000,http://127.0.0.1:9000
# AUTH_CORS=https://atharr.duckdns.org,http://localhost:8000,http://127.0.0.1:8000,http://localhost:9000,http://127.0.0.1:9000
# JWT_SECRET=<قيمة عشوائية طويلة>
# COOKIE_SECRET=<قيمة عشوائية طويلة>
# DB_NAME=medusa
```
- توليد الأسرار:
```bash
openssl rand -base64 32
```

### 1.e مساحة القرص والصور:
```bash
df -h /
docker system df
# تنظيف آمن بعد بناء جديد:
docker builder prune -f
```
- تنبيه: امتلاء قرص الخادم يوقف PostgreSQL ويوقف المتجر. صور الإنتاجapproximately 1.1 GB (backend) و1.5 GB (storefront).

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
- **السبب**: وسيط Next.js (`apps/storefront/src/middleware.ts`) يعيد توجيه طلبات React Server Components مرة واحدة (307) بإضافة معامل `_rsc`، وبعض المتصفحات تسجّل 404 في وحدة التحكم.
- **الأثر**: غير مؤثر — فتح الصفحات والتنقل وعملية الشراء تعمل بشكل صحيح؛ الطلب يعيد 200 عند المتابعة.

### صفحة المتجر `/eg/store` فارغة (Couldn't load products: Not Found)
- **السبب**: استدعاءات المتصفح للـAPI عبر SDK تذهب إلى `/store/*`؛ بدون توجيه Nginx لهذا المسار كانت تصل إلى المتجر (Next.js)instead of الباك إند وتُرجع 404.
- **الحل**: إضافة `location /store` في `/etc/nginx/sites-available/atharr.duckdns.org` يوجّه إلى `http://127.0.0.1:9000` (تم تنفيذه). التحقق:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "x-publishable-api-key: pk_9a857a6df7f4065b02199b8c55f7300916da5a3ec0973b524d81e4dd24bdbd70" https://atharr.duckdns.org/store/regions
```

### خادم جديد: قاعدة البيانات `athar` غير موجودة
- **السبب**: خدمة Postgres في `docker-compose.yml` تنشئ قاعدة `medusa` افتراضياً، بينما يستخدم التطبيق قاعدة `athar`.
- **الحل**: إنشاءها يدوياً بعد أول تشغيل لـ Postgres:
```bash
docker exec athar-postgres-1 psql -U medusa -d postgres -c "CREATE DATABASE athar OWNER medusa;"
```

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

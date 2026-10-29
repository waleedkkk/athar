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
  - `athar-backend-1`: Medusa v2.22.1 API + Admin (منفذ داخلي 9000).
  - `athar-storefront-1`: Next.js 16 Storefront (منفذ داخلي 8000).
  - `athar-postgres-1`: PostgreSQL 16 قاعدة بيانات `athar`.
  - `athar-redis-1`: Redis 7 للكاش والأحداث.
- **خادم الويب والتوجيه (Host Nginx)**:
  - ملف التكوين: `/etc/nginx/sites-available/atharr.duckdns.org`
  - التوجيه:
    - `/` → المتجر الأمامي (`http://127.0.0.1:8000`)
    - `/app` و `/admin` و `/auth/` → الباك إند ولوحة التحكم (`http://127.0.0.1:9000`)
  - التشفير: شهادة SSL صادرة عبر Let's Encrypt / Certbot وتتجدد تلقائياً.

---

## بوابات الدفع المصرية المفعلة
1. **الدفع عند الاستلام (COD)**: `pp_cash-on-delivery_cod`
2. **إنستاباي (InstaPay)**: `pp_instapay_instapay` (حساب: `athar@instapay`)
3. **فودافون كاش / محافظ إلكترونية**: `pp_vodafone-cash_vodafone` (رقم: `01000000000`)

---

## أوامر الصيانة الشائعة (Maintenance Commands)

### 1. إعادة تشغيل الخدمات:
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
- **السبب**: خادم Next.js في وضع التطوير يرفض طلبات HMR/WebSocket قادمة من النطاق العام، فتفشل عملية الترطيب (hydration) ويصبح المتجر غير تفاعلي دون أي رسالة خطأ ظاهرة.
- **الحل**: إضافة النطاق العام إلى `allowedDevOrigins` في `apps/storefront/next.config.js` ثم إعادة تشغيل حاوية المتجر:
```bash
docker restart athar-storefront-1
```

### ظهور بيانات قديمة بعد تعديل قاعدة البيانات مباشرة (مثل أسماء التصنيفات)
- **السبب**: المتجر يستخدم `cache: "force-cache"`، فتُخزّن بيانات الكتالوج في كاش Next.js.
- **الحل**: مسح كاش الجلب ثم إعادة تشغيل المتجر:
```bash
docker exec athar-storefront-1 sh -lc 'rm -rf /app/apps/storefront/.next/dev/cache/fetch-cache/*'
docker restart athar-storefront-1
```

---

## اختبار الشراء الحقيقي (Live Checkout Test)
- تم تنفيذ عملية شراء كاملة بنجاح عبر `https://atharr.duckdns.org`:
  - الطلب رقم 1: `order_01M64GA6NSK7KN04R2FBVS8C27` — الإجمالي 1,520 EGP (3 قطع + شحن القاهرة والجيزة 50 EGP) — الدفع عند الاستلام.
  - الطلب رقم 2: `order_01M64N4208S19TS4MBFVHKWQ1R` — الإجمالي 540 EGP (قطعة واحدة + شحن) — الدفع عند الاستلام.
- التحقق من الطلبات يتم مباشرة في قاعدة البيانات:
```bash
docker exec athar-postgres-1 psql -U medusa -d athar -c "select id, display_id, status, currency_code, email, created_at from \"order\" order by created_at desc limit 5;"
```

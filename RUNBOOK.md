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

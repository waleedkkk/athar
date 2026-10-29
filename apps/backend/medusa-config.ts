import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/egypt-payments/cod',
            id: 'cod',
            options: {
              instructions: 'الدفع نقداً عند استلام الشحنة ومعاينتها.',
            },
          },
          {
            resolve: './src/modules/egypt-payments/instapay',
            id: 'instapay',
            options: {
              account_info: process.env.INSTAPAY_ACCOUNT || 'athar@instapay',
              instructions: 'يرجى تحويل المبلغ عبر تطبيق إنستاباي إلى العنوان أعلاه.',
            },
          },
          {
            resolve: './src/modules/egypt-payments/vodafone',
            id: 'vodafone',
            options: {
              account_info: process.env.VODAFONE_CASH_NUMBER || '01000000000',
              instructions: 'يرجى تحويل المبلغ إلى رقم فودافون كاش أعلاه.',
            },
          },
        ],
      },
    },
  ],
})

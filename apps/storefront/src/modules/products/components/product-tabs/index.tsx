"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "تفاصيل التيشيرت والخامة",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "دليل المقاسات والعناية",
      component: <SizeAndCareTab />,
    },
    {
      label: "الشحن والاستبدال في مصر",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold text-athar-maroon">الخامة</span>
            <p className="text-ui-fg-subtle">
              {product.material ? product.material : "قطن مصري 100% ممتاز (Heavyweight 220 GSM)"}
            </p>
          </div>
          <div>
            <span className="font-semibold text-athar-maroon">بلد الصنع</span>
            <p className="text-ui-fg-subtle">
              {product.origin_country ? product.origin_country : "صُنع في مصر"}
            </p>
          </div>
          <div>
            <span className="font-semibold text-athar-maroon">القصة (Fit)</span>
            <p className="text-ui-fg-subtle">
              {product.type ? product.type.value : "قصة مريحة معاصرة (Oversized / Relaxed Fit)"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold text-athar-maroon">نوع الطباعة</span>
            <p className="text-ui-fg-subtle">طباعة عالية الدقة ثابتة ومقاومة للغسيل المتكرر</p>
          </div>
          <div>
            <span className="font-semibold text-athar-maroon">ياقة التيشيرت</span>
            <p className="text-ui-fg-subtle">ياقة دائرية محاكة بدقة ومزدوجة التدعيم</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const SizeAndCareTab = () => {
  return (
    <div className="text-small-regular py-8 space-y-4 text-ui-fg-subtle">
      <div>
        <span className="font-semibold text-athar-maroon block mb-2">جدول المقاسات التقريبي (بالسم):</span>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border border-ui-border-base">
            <thead className="bg-athar-cream/60">
              <tr>
                <th className="p-2 border-b border-ui-border-base text-start">المقاس</th>
                <th className="p-2 border-b border-ui-border-base text-start">عرض الصدر</th>
                <th className="p-2 border-b border-ui-border-base text-start">الطول</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ui-border-base/50">
                <td className="p-2 font-medium">S</td>
                <td className="p-2">52 سم</td>
                <td className="p-2">70 سم</td>
              </tr>
              <tr className="border-b border-ui-border-base/50">
                <td className="p-2 font-medium">M</td>
                <td className="p-2">55 سم</td>
                <td className="p-2">72 سم</td>
              </tr>
              <tr className="border-b border-ui-border-base/50">
                <td className="p-2 font-medium">L</td>
                <td className="p-2">58 سم</td>
                <td className="p-2">74 سم</td>
              </tr>
              <tr className="border-b border-ui-border-base/50">
                <td className="p-2 font-medium">XL</td>
                <td className="p-2">61 سم</td>
                <td className="p-2">76 سم</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">XXL</td>
                <td className="p-2">64 سم</td>
                <td className="p-2">78 سم</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <span className="font-semibold text-athar-maroon block mb-1">تعليمات الغسيل والعناية:</span>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>يُغسل مقلوباً بالماء البارد (30 درجة مئوية).</li>
          <li>تجنب استخدام المبيضات أو الكلور.</li>
          <li>يُكوى من الداخل وتجنب ملامسة المكواة للطباعة مباشرة.</li>
          <li>لا يُنصح بالتجفيف الآلي بدرجات حرارة عالية للحفاظ على قوام القطن.</li>
        </ul>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-start gap-x-3">
          <FastDelivery />
          <div>
            <span className="font-semibold text-athar-maroon">توصيل سريع داخل مصر</span>
            <p className="max-w-md text-ui-fg-subtle">
              القاهرة والجيزة: خلال 24 إلى 48 ساعة عمل. باقي المحافظات خلال 3-5 أيام عمل مع إمكانية المعاينة قبل الاستلام.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-3">
          <Refresh />
          <div>
            <span className="font-semibold text-athar-maroon">استبدال سهل للمقاس</span>
            <p className="max-w-md text-ui-fg-subtle">
              المقاس مش مظبوط؟ بنبدلك المقاس بكل سهولة خلال 14 يوماً من استلام الطلب.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-3">
          <Back />
          <div>
            <span className="font-semibold text-athar-maroon">معاينة واسترجاع مريح</span>
            <p className="max-w-md text-ui-fg-subtle">
              حقك الكامل في الاسترجاع أو الاستبدال إذا كان المنتج بحالته الأصلية، ودفع مريح عند الاستلام أو عبر إنستاباي.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs

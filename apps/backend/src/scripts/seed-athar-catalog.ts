import {
  createCollectionsWorkflow,
  createProductsWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

export default async function seedAtharCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  logger.info("Starting ATHAR Egyptian t-shirt catalog seeding...")

  // 1. Fetch sales channel and region
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const defaultSalesChannel = salesChannels[0]

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  const egyptRegion = regions.find((r: any) => r.currency_code === "egp") || regions[0]

  logger.info(`Using Sales Channel: ${defaultSalesChannel.id}, Region: ${egyptRegion.id}`)

  // 2. Create Collections
  const collectionsData = [
    { title: "المجموعة التراثية (Heritage)", handle: "heritage" },
    { title: "مجموعة الخط العربي (Calligraphy)", handle: "calligraphy" },
    { title: "مجموعة الشارع المصري (Streetwear)", handle: "streetwear" },
  ]

  let createdCollections: any[] = []
  try {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: collectionsData,
      },
    })
    createdCollections = result
    logger.info(`Created ${createdCollections.length} collections.`)
  } catch (err: any) {
    logger.warn(`Collections may already exist: ${err.message}`)
    const { data: existing } = await query.graph({
      entity: "product_collection",
      fields: ["id", "title", "handle"],
    })
    createdCollections = existing
  }

  const heritageCol = createdCollections.find((c: any) => c.handle === "heritage") || createdCollections[0]
  const calligraphyCol = createdCollections.find((c: any) => c.handle === "calligraphy") || createdCollections[0]
  const streetwearCol = createdCollections.find((c: any) => c.handle === "streetwear") || createdCollections[0]

  // 3. Define ATHAR T-Shirts
  const sizes = ["S", "M", "L", "XL", "XXL"]
  const tshirts = [
    {
      title: "تيشيرت أثر الكلاسيكي - زيتوني وأوف وايت",
      handle: "athar-signature-tshirt",
      subtitle: "التصميم الأصلي لعلامة أثر مع غصن الزيتون التراثي",
      description: "تيشيرت أثر الأساسي مصنوع من قطن مصري 100% ثقيل (220 GSM). يجمع بين درجات الزيتوني العتيق والأوف وايت مع لوجو أثر الأيقوني المطرز بدقة على الصدر ورسمة الظهر التراثية.",
      collection_id: heritageCol?.id,
      price: 490,
      colors: ["كريمي / أوف وايت", "زيتوني عتيق", "أسود داكن"],
    },
    {
      title: "تيشيرت مفتاح الحياة - عنخ الذهبي",
      handle: "ankh-heritage-tshirt",
      subtitle: "رمز الخلود المصري القديم برؤية بصرية معاصرة",
      description: "تيشيرت مستوحى من الحضارة المصرية القديمة، يحمل رمز مفتاح الحياة بطباعة حريرية ثلاثية الأبعاد بلمسات ذهبية عتيقة. قصة أوفرسايز مريحة تمنحك إطلالة فخمة وأصيلة.",
      collection_id: heritageCol?.id,
      price: 520,
      colors: ["أسود داكن", "كريمي / أوف وايت"],
    },
    {
      title: "تيشيرت سيدة الغناء - كوكب الشرق",
      handle: "om-kalthoum-calligraphy-tshirt",
      subtitle: "فن الخط العربي ممزوج بروح ليالي زمان",
      description: "تيشيرت يحتفي بأيقونة الطرب العربي أم كلثوم بتصميم خط عربي أصيل لعبارة «أنت عمري». طباعة عالية الدقة مع قماش قطني معالج ضد الانكماش ليضمن الراحة والدوام.",
      collection_id: calligraphyCol?.id,
      price: 480,
      colors: ["أسود فاحم", "وردي ترابي"],
    },
    {
      title: "تيشيرت القاهرة المعز - شارع المعز",
      handle: "el-moez-cairo-tshirt",
      subtitle: "عبق القاهرة التاريخية والعمارة الإسلامية",
      description: "تيشيرت مستوحى من تفاصيل وزخارف المشربيات ومآذن شارع المعز لدين الله الفاطمي. تصميم مرسوم يدوياً يعكس روح أزقة القاهرة القديمة وتراثها الأصيل.",
      collection_id: streetwearCol?.id,
      price: 460,
      colors: ["أوف وايت", "زيتوني عتيق"],
    },
    {
      title: "تيشيرت حورس الحامي - صقر النيل",
      handle: "horus-falcon-tshirt",
      subtitle: "قوة وحماية مستوحاة من أجنحة حورس",
      description: "تصميم جريء ومفصل لأجنحة حورس على ظهر التيشيرت مع تفاصيل الصدر البسيطة. مناسب لعشاق الإطلالات المعاصرة القوية مع الحفاظ على روح الهوية المصرية.",
      collection_id: heritageCol?.id,
      price: 540,
      colors: ["أسود داكن", "كحلي نيلي"],
    },
    {
      title: "تيشيرت قهوة الفيشاوي - نبض الحسين",
      handle: "fishawy-streetwear-tshirt",
      subtitle: "روح المقاهي الشعبية وسهرات خان الخليلي",
      description: "تيشيرت من مجموعة الشارع المصري يجسد أجواء مقهى الفيشاوي الشهير برسمة فنية معاصرة تعبر عن دفء اللقاءات وأصالة شوارع الحسين.",
      collection_id: streetwearCol?.id,
      price: 450,
      colors: ["كريمي / أوف وايت", "أسود داكن"],
    },
  ]

  // 4. Create products
  for (const item of tshirts) {
    // Check if product already exists
    const { data: existingProd } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
      filters: { handle: item.handle },
    })

    if (existingProd && existingProd.length > 0) {
      logger.info(`Product ${item.handle} already exists, skipping.`)
      continue
    }

    const variants: any[] = []
    for (const color of item.colors) {
      for (const size of sizes) {
        variants.push({
          title: `${color} / ${size}`,
          sku: `ATHAR-${item.handle.substring(0, 4).toUpperCase()}-${color.substring(0, 2)}-${size}`,
          options: {
            "المقاس": size,
            "اللون": color,
          },
          prices: [
            {
              amount: item.price,
              currency_code: "egp",
            },
          ],
        })
      }
    }

    const { result: [createdProduct] } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            handle: item.handle,
            status: ProductStatus.PUBLISHED,
            collection_id: item.collection_id,
            material: "قطن مصري 100% (220 GSM)",
            origin_country: "eg",
            weight: 300,
            options: [
              {
                title: "المقاس",
                values: sizes,
              },
              {
                title: "اللون",
                values: item.colors,
              },
            ],
            variants,
            sales_channels: [
              {
                id: defaultSalesChannel.id,
              },
            ],
            thumbnail: "/logo.jpg",
            images: [{ url: "/logo.jpg" }],
          },
        ],
      },
    })

    logger.info(`Created product: ${createdProduct.title} (${variants.length} variants)`)
  }

  logger.info("Finished ATHAR catalog seeding successfully!")
}

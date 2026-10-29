import Image from "next/image"

import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="w-full border-b border-ui-border-base bg-athar-cream">
      <div className="content-container grid items-center gap-10 py-16 small:grid-cols-2 small:py-24">
        <div className="flex flex-col items-center gap-6 text-center small:items-start small:text-start">
          <span className="text-small-semi tracking-wide text-athar-olive">
            تصاميم مصرية بروح معاصرة
          </span>
          <Heading
            level="h1"
            className="text-4xl leading-tight text-athar-maroon small:text-5xl"
          >
            تصاميم تترك أثراً
          </Heading>
          <Text className="max-w-md text-base-regular leading-7 text-ui-fg-subtle">
            تيشيرتات بتصاميم أصلية مستوحاة من التراث المصري، بجودة عالية
            وتفاصيل تُروى. اختر تصميمك المفضل واترك أثرك.
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-3 small:justify-start">
            <LocalizedClientLink href="/store">
              <Button size="large">تسوق الآن</Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/collections">
              <Button variant="secondary" size="large">
                المجموعات
              </Button>
            </LocalizedClientLink>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/logo.jpg"
            alt="شعار أثر"
            width={715}
            height={524}
            priority
            className="h-auto w-full max-w-[420px] mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero

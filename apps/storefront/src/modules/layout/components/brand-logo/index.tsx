import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BrandLogoProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

const HEIGHTS = {
  sm: "h-11",
  md: "h-16",
  lg: "h-28 small:h-36",
}

export default function BrandLogo({
  size = "sm",
  className = "",
}: BrandLogoProps) {
  return (
    <LocalizedClientLink
      href="/"
      aria-label="أثر"
      className={`inline-flex items-center ${className}`}
      data-testid="nav-store-link"
    >
      <Image
        src="/logo.jpg"
        alt="أثر"
        width={715}
        height={524}
        priority
        className={`${HEIGHTS[size]} w-auto object-contain mix-blend-multiply`}
      />
    </LocalizedClientLink>
  )
}

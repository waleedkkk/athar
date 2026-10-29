import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import BrandLogo from "@modules/layout/components/brand-logo"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-ui-bg-base relative small:min-h-screen">
      <div className="h-20 bg-ui-bg-base border-b border-ui-border-base">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="-rotate-90 rtl:rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              العودة إلى سلة التسوق
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              الرجوع
            </span>
          </LocalizedClientLink>
          <div className="flex items-center">
            <BrandLogo size="sm" />
          </div>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-6 w-full flex items-center justify-center text-ui-fg-muted txt-compact-small border-t border-ui-border-base">
        <span>© {new Date().getFullYear()} أثر — صُنع بحب في مصر</span>
      </div>
    </div>
  )
}

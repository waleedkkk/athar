import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Cairo } from "next/font/google"
import "styles/globals.css"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  description:
    "تيشيرتات بتصاميم مصرية أصلية مستوحاة من التراث، بجودة عالية وتفاصيل تُروى.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-mode="light" className={cairo.variable}>
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body className="font-sans">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}

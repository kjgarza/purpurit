import type { Metadata } from "next"
import { Inter, Lora, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
})

const repoName = process.env.NEXT_PUBLIC_REPO_NAME
const siteUrl = repoName
  ? `https://kristiangarza.github.io/${repoName}`
  : "https://example.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tomasa — En memoria",
    template: "%s | Tomasa",
  },
  description: "Un memorial digital dedicado a la memoria de nuestra abuela Tomasa",
  openGraph: {
    title: "Tomasa — En memoria",
    description: "Un memorial digital dedicado a la memoria de nuestra abuela Tomasa",
    url: siteUrl,
    siteName: "Tomasa",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Tomasa — En memoria",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomasa — En memoria",
    description: "Un memorial digital dedicado a la memoria de nuestra abuela Tomasa",
    images: ["/opengraph.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} ${playfair.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

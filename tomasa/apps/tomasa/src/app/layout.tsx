import type { Metadata } from "next"
import { Fraunces, Archivo, Source_Serif_4, Caveat } from "next/font/google"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
})

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-caveat",
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
      <body className={`${archivo.variable} ${sourceSerif.variable} ${fraunces.variable} ${caveat.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

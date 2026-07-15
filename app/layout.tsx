import type { Metadata, Viewport } from "next"
import { Geist, Space_Mono } from "next/font/google"
import { SwRegister } from "@/shared/ui/sw-register"
import { PageTransition } from "@/shared/ui/page-transition"
import "./globals.css"

const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  themeColor: "#f9f9fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Zerc — Адаптивный тьютор",
  description: "Учись любой теме с персонализированными вопросами на основе ИИ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zerc",
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <PageTransition>{children}</PageTransition>
        <SwRegister />
      </body>
    </html>
  )
}

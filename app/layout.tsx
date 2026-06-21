import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Lora } from "next/font/google"
import { SwRegister } from "@/shared/ui/sw-register"
import "./globals.css"

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" })

const lora = Lora({
  subsets: ["latin", "latin-ext", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-lora",
})

export const viewport: Viewport = {
  themeColor: "#0c0b09",
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
    <html lang="ru" className={`${geist.variable} ${lora.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  )
}

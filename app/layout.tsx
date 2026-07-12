import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import { SwRegister } from "@/shared/ui/sw-register"
import { PageTransition } from "@/shared/ui/page-transition"
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/shared/lib/theme"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  themeColor: "#f6f4fc",
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
    <html lang="ru" data-theme={DEFAULT_THEME} suppressHydrationWarning className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <PageTransition>{children}</PageTransition>
        <SwRegister />
      </body>
    </html>
  )
}

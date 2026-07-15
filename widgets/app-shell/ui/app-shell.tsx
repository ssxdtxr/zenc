import type { ReactNode } from "react"
import { Sidebar, MobileNav } from "./sidebar"

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
    <Sidebar />
    <main className="md:ml-64" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 72 }}>
      {children}
    </main>
    <MobileNav />
  </div>
)

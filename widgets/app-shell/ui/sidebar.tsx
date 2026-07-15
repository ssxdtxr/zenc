"use client"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GridIcon, FolderIcon, InsightsIcon, UsersIcon, HelpIcon, LogoutIcon } from "@/shared/ui/icons"

const NAV_ITEMS = [
  { href: "/", label: "Обзор", icon: GridIcon, match: (p: string) => p === "/" || p.startsWith("/topic"), soon: false },
  { href: "/", label: "Ресурсы", icon: FolderIcon, match: () => false, soon: true },
  { href: "/", label: "Аналитика", icon: InsightsIcon, match: () => false, soon: true },
  { href: "/", label: "Сообщество", icon: UsersIcon, match: () => false, soon: true },
]

const NavLink = ({ item, active }: { item: (typeof NAV_ITEMS)[number]; active: boolean }) => {
  const router = useRouter()
  const Icon = item.icon

  if (item.soon) {
    return (
      <div
        title="Скоро появится"
        style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%",
          padding: "10px 14px", borderRadius: 10,
          color: "var(--text-3)", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
          cursor: "default",
        }}
      >
        <Icon size={19} color="var(--text-3)" />
        <span style={{ flex: 1 }}>{item.label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", flexShrink: 0 }}>
          Скоро
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push(item.href)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
        background: active ? "#000" : "transparent",
        color: active ? "#fff" : "var(--text-2)",
        fontFamily: "inherit", fontSize: 14, fontWeight: 600,
      }}
    >
      <Icon size={19} color={active ? "#fff" : "var(--text-2)"} />
      {item.label}
    </button>
  )
}

export const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside
      className="hidden md:flex"
      style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: 256, flexDirection: "column",
        gap: 8, padding: 16, zIndex: 50, background: "#fff", borderRight: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px 22px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Z</span>
        </div>
        <div>
          <h1 className="font-display" style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#000", lineHeight: 1 }}>Zerc</h1>
          <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-3)", textTransform: "uppercase" }}>Core Tech</p>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.label} item={item} active={item.match(pathname)} />
        ))}
      </nav>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
          <HelpIcon size={16} color="var(--text-2)" /> Помощь
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", color: "#ba1a1a", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}
        >
          <LogoutIcon size={16} color="#ba1a1a" /> Выйти
        </motion.button>
      </div>
    </aside>
  )
}

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Главная", icon: GridIcon, match: (p: string) => p === "/" || p.startsWith("/topic") },
]

export const MobileNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <div
      className="flex md:hidden"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        justifyContent: "space-around", padding: "10px 16px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {MOBILE_NAV_ITEMS.map(item => {
        const active = item.match(pathname)
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", color: active ? "#000" : "var(--text-3)", fontFamily: "inherit" }}
          >
            <Icon size={22} color={active ? "#000" : "var(--text-3)"} />
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

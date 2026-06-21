import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

type Props = { children: ReactNode; className?: string; style?: React.CSSProperties }

export const Badge = ({ children, className, style }: Props) => (
  <span
    className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", className)}
    style={style}
  >
    {children}
  </span>
)

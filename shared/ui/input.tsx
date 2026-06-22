import { cn } from "@/shared/lib/cn"
import type { InputHTMLAttributes } from "react"

type Props = InputHTMLAttributes<HTMLInputElement>

export const Input = ({ className, ...props }: Props) => (
  <input
    className={cn("w-full rounded-2xl px-4 py-3.5 outline-none transition-all", className)}
    style={{
      background: "var(--surface)",
      border: "1.5px solid var(--border)",
      color: "var(--text)",
      boxShadow: "var(--shadow-sm)",
      fontSize: "16px",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "var(--violet)"
      e.currentTarget.style.boxShadow = "0 0 0 3px var(--violet-light), var(--shadow-sm)"
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "var(--border)"
      e.currentTarget.style.boxShadow = "var(--shadow-sm)"
    }}
    {...props}
  />
)

import { cn } from "@/shared/lib/cn"
import type { ButtonHTMLAttributes } from "react"

type Variant = "primary" | "secondary" | "ghost"
type Size = "sm" | "md" | "lg"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary: "text-white disabled:opacity-40",
  secondary: "text-violet-700 disabled:opacity-40",
  ghost: "text-violet-500 hover:text-violet-700 disabled:opacity-40",
}

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "w-full py-4 text-base rounded-2xl",
}

export const Button = ({ variant = "primary", size = "md", className, children, style, ...props }: Props) => {
  const isPrimary = variant === "primary"
  const isSecondary = variant === "secondary"

  return (
    <button
      className={cn("font-semibold transition-all active:scale-[0.98]", variants[variant], sizes[size], className)}
      style={{
        background: isPrimary
          ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
          : isSecondary
          ? "var(--violet-light)"
          : "transparent",
        boxShadow: isPrimary ? "0 4px 16px rgba(124,58,237,0.3), 0 1px 4px rgba(124,58,237,0.2)" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

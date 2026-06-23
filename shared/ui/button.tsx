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
  secondary: "disabled:opacity-40",
  ghost: "disabled:opacity-40",
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
          ? "linear-gradient(135deg, #9b6bff 0%, #6d3cff 100%)"
          : isSecondary
          ? "rgba(255,255,255,0.08)"
          : "transparent",
        boxShadow: isPrimary ? "0 8px 22px rgba(109,60,255,0.45)" : undefined,
        border: isSecondary ? "1px solid rgba(255,255,255,0.16)" : undefined,
        color: isSecondary ? "rgba(255,255,255,0.85)" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

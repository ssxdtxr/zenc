import { cn } from "@/shared/lib/cn"
import type { Ref, TextareaHTMLAttributes } from "react"

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>
}

export const Textarea = ({ className, ref, ...props }: Props) => (
  <textarea
    ref={ref}
    className={cn("w-full rounded-2xl px-4 py-3.5 leading-relaxed resize-none outline-none transition-all", className)}
    style={{
      background: "rgba(var(--fg-rgb),0.06)",
      border: "1px solid rgba(var(--fg-rgb),0.12)",
      color: "#fff",
      fontSize: "16px",
      borderRadius: "14px",
      padding: "14px",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "var(--accent)"
      e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-light), var(--shadow-sm)"
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "var(--border)"
      e.currentTarget.style.boxShadow = "var(--shadow-sm)"
    }}
    {...props}
  />
)

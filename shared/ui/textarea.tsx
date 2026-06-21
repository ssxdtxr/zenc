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
      background: "var(--surface)",
      border: "1.5px solid var(--border)",
      color: "var(--text)",
      boxShadow: "var(--shadow-sm)",
      fontSize: "16px",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "var(--violet)"
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12), var(--shadow-sm)"
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "var(--border)"
      e.currentTarget.style.boxShadow = "var(--shadow-sm)"
    }}
    {...props}
  />
)

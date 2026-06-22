import { cn } from "@/shared/lib/cn"

type Props = {
  text: string
  className?: string
}

// Parse inline markdown: **bold**, *italic*, `code`
const parseInline = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))

    if (match[2]) {
      parts.push(<strong key={match.index} style={{ color: "var(--text)", fontWeight: 700 }}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<em key={match.index} style={{ color: "var(--violet)" }}>{match[3]}</em>)
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-lg text-xs font-mono"
          style={{ background: "var(--violet-light)", color: "var(--violet)" }}
        >
          {match[4]}
        </code>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export const RichText = ({ text, className }: Props) => {
  const paragraphs = text.split("\n\n").filter(Boolean)

  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          {parseInline(para)}
        </p>
      ))}
    </div>
  )
}

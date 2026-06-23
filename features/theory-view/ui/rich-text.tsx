import { cn } from "@/shared/lib/cn"

type Props = {
  text: string
  className?: string
}

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
      parts.push(<em key={match.index} style={{ color: "var(--accent)" }}>{match[3]}</em>)
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-lg text-xs font-mono"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
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

type Block =
  | { type: "code"; lang: string; content: string }
  | { type: "text"; content: string }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > last) {
      const before = text.slice(last, match.index).trim()
      if (before) blocks.push({ type: "text", content: before })
    }
    blocks.push({ type: "code", lang: match[1] || "", content: match[2].trim() })
    last = match.index + match[0].length
  }

  const after = text.slice(last).trim()
  if (after) blocks.push({ type: "text", content: after })

  return blocks
}

export const RichText = ({ text, className }: Props) => {
  const blocks = parseBlocks(text)

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {block.lang && (
                <div
                  className="px-3 py-1.5 text-xs font-mono font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}
                >
                  {block.lang}
                </div>
              )}
              <pre
                className="px-4 py-3 text-sm font-mono overflow-x-auto leading-relaxed"
                style={{ background: "var(--surface)", color: "var(--text)" }}
              >
                <code>{block.content}</code>
              </pre>
            </div>
          )
        }

        return block.content.split("\n\n").filter(Boolean).map((para, j) => (
          <p key={`${i}-${j}`} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            {parseInline(para)}
          </p>
        ))
      })}
    </div>
  )
}

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
        <code key={match.index} className="px-1.5 py-0.5 rounded-lg text-xs font-mono" style={{ background: "rgba(155,107,255,0.15)", color: "#6b3fd6" }}>
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
  | { type: "h2"; content: string }
  | { type: "h3"; content: string }
  | { type: "hr" }
  | { type: "table"; rows: string[][] }
  | { type: "list"; items: string[] }
  | { type: "text"; content: string }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []

  // Extract code blocks first
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g
  const segments: { start: number; end: number; block: Block }[] = []
  let m: RegExpExecArray | null
  while ((m = codeBlockRegex.exec(text)) !== null) {
    segments.push({
      start: m.index,
      end: m.index + m[0].length,
      block: { type: "code", lang: m[1] || "", content: m[2].trim() },
    })
  }

  let pos = 0
  for (const seg of segments) {
    if (pos < seg.start) {
      parseTextBlocks(text.slice(pos, seg.start), blocks)
    }
    blocks.push(seg.block)
    pos = seg.end
  }
  if (pos < text.length) parseTextBlocks(text.slice(pos), blocks)

  return blocks
}

function parseTextBlocks(text: string, blocks: Block[]) {
  const lines = text.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // H2
    if (/^## /.test(trimmed)) {
      blocks.push({ type: "h2", content: trimmed.slice(3).trim() })
      i++; continue
    }

    // H3
    if (/^### /.test(trimmed)) {
      blocks.push({ type: "h3", content: trimmed.slice(4).trim() })
      i++; continue
    }

    // HR
    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "hr" })
      i++; continue
    }

    // Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i].trim()
        if (!/^\|[-| ]+\|$/.test(row)) tableLines.push(row)
        i++
      }
      const rows = tableLines.map(l =>
        l.slice(1, -1).split("|").map(c => c.trim())
      )
      if (rows.length > 0) blocks.push({ type: "table", rows })
      continue
    }

    // List
    if (/^[-*] /.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2).trim())
        i++
      }
      blocks.push({ type: "list", items })
      continue
    }

    // Regular paragraph — collect until blank line
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim()) {
      paraLines.push(lines[i].trim())
      i++
    }
    const para = paraLines.join(" ")
    if (para) blocks.push({ type: "text", content: para })
  }
}

export const RichText = ({ text, className }: Props) => {
  const blocks = parseBlocks(text)

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              {block.lang && (
                <div className="px-3 py-1.5 text-xs font-mono font-medium" style={{ background: "rgba(10,9,16,0.9)", color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {block.lang}
                </div>
              )}
              <pre className="px-4 py-3 text-sm font-mono overflow-x-auto leading-relaxed" style={{ background: "rgba(8,7,15,0.92)", color: "rgba(255,255,255,0.85)", margin: 0 }}>
                <code>{block.content}</code>
              </pre>
            </div>
          )
        }

        if (block.type === "h2") {
          return (
            <p key={i} className="font-display text-base font-bold leading-snug" style={{ color: "var(--text)", marginTop: 4 }}>
              {parseInline(block.content)}
            </p>
          )
        }

        if (block.type === "h3") {
          return (
            <p key={i} className="text-sm font-bold leading-snug" style={{ color: "var(--text)", marginTop: 2 }}>
              {parseInline(block.content)}
            </p>
          )
        }

        if (block.type === "hr") {
          return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(var(--fg-rgb),0.1)", margin: "4px 0" }} />
        }

        if (block.type === "list") {
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, lineHeight: 1.55, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>·</span>
                  <span>{parseInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === "table") {
          const [header, ...body] = block.rows
          return (
            <div key={i} style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                {header && (
                  <thead>
                    <tr>
                      {header.map((cell, j) => (
                        <th key={j} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text)", borderBottom: "1px solid rgba(var(--fg-rgb),0.15)", whiteSpace: "nowrap" }}>
                          {parseInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {body.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k} style={{ padding: "6px 10px", color: "var(--text-2)", borderBottom: "1px solid rgba(var(--fg-rgb),0.06)" }}>
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        // text
        return (
          <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            {parseInline((block as { type: "text"; content: string }).content)}
          </p>
        )
      })}
    </div>
  )
}

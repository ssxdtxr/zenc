type Props = {
  gaps: string[]
}

export const KnowledgeGaps = ({ gaps }: Props) => {
  if (!gaps.length) return null

  return (
    <div className="rounded-xl p-4 bg-zinc-900 border border-zinc-800 space-y-2">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
        Пробелы в знаниях
      </p>
      <ul className="space-y-1">
        {gaps.map((gap, i) => (
          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5">›</span>
            {gap}
          </li>
        ))}
      </ul>
    </div>
  )
}

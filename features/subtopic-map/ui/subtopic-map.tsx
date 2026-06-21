import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Subtopic } from "@/entities/topic/model/types"
import { cn } from "@/shared/lib/cn"

type Props = {
  subtopics: Subtopic[]
  compact?: boolean
}

export const SubtopicMap = ({ subtopics, compact = false }: Props) => {
  if (!subtopics.length) return null

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {subtopics.map((s) => {
          const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
          return (
            <span key={s.name} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color, cfg.bg)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
              {s.name}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {subtopics.map((s) => {
        const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
        return (
          <div key={s.name} className={cn("rounded-xl p-4 border border-zinc-800", cfg.bg)}>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
              <span className={cn("text-sm font-semibold", cfg.color)}>{s.name}</span>
              <span className={cn("ml-auto text-xs font-medium", cfg.color)}>{cfg.label}</span>
            </div>
            {s.recommendation && (
              <p className="text-xs text-zinc-400 leading-relaxed pl-4">{s.recommendation}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

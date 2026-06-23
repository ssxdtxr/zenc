import { DIFFICULTY_CONFIG } from "@/entities/session/config"
import type { AppState, Difficulty } from "@/entities/session/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

type Props = {
  topic: string
  appState: AppState
  difficulty: Difficulty | null
  correctCount: number
  answeredCount: number
  onReset: () => void
}

export const Header = ({ topic, appState, difficulty, correctCount, answeredCount, onReset }: Props) => {
  const diff = difficulty ? DIFFICULTY_CONFIG[difficulty] : null

  return (
    <header className="border-b border-zinc-800/60 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 shrink-0 bg-red-600 rounded-md flex items-center justify-center text-white font-bold text-xs select-none">
          Z
        </div>
        <span className="font-semibold text-sm">Zerc</span>
        {topic && appState !== "topic" && (
          <span className="text-zinc-500 text-sm truncate hidden sm:inline">/ {topic}</span>
        )}
      </div>

      {appState !== "topic" && (
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <span className="text-zinc-200 font-semibold">{correctCount}</span>
            <span className="text-zinc-600">/</span>
            <span>{answeredCount}</span>
          </div>
          {diff && (
            <Badge className={`${diff.color} ${diff.bg} hidden sm:inline`}>{diff.label}</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Сменить тему</span>
            <span className="sm:hidden">✕</span>
          </Button>
        </div>
      )}
    </header>
  )
}

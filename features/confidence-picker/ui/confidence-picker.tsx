import { UncertainIcon, PartialIcon, ConfidentIcon } from "@/shared/ui/icons"

type ConfidenceLevel = 1 | 2 | 3

type Props = {
  value: ConfidenceLevel | null
  onChange: (v: ConfidenceLevel) => void
}

const OPTIONS: {
  level: ConfidenceLevel
  label: string
  Icon: typeof UncertainIcon
  color: string
  bg: string
  border: string
}[] = [
  { level: 1, label: "Не уверен",  Icon: UncertainIcon,  color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  { level: 2, label: "Частично",   Icon: PartialIcon,    color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)"  },
  { level: 3, label: "Уверен",     Icon: ConfidentIcon,  color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)"  },
]

export const ConfidencePicker = ({ value, onChange }: Props) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
      Насколько уверен в ответе?
    </p>
    <div className="flex gap-2">
      {OPTIONS.map(({ level, label, Icon, color, bg, border }) => {
        const isSelected = value === level
        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-xs font-semibold transition-all active:scale-[0.97]"
            style={{
              background: isSelected ? bg : "var(--surface-2)",
              border: `1.5px solid ${isSelected ? border : "var(--border)"}`,
              color: isSelected ? color : "var(--text-3)",
            }}
          >
            <Icon size={18} color={isSelected ? color : "var(--text-3)"} />
            {label}
          </button>
        )
      })}
    </div>
  </div>
)

export type { ConfidenceLevel }

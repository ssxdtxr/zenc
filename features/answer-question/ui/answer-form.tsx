"use client"

import { ErrorMessage } from "@/shared/ui/error-message"
import { Textarea } from "@/shared/ui/textarea"
import { Button } from "@/shared/ui/button"
import type { RefObject } from "react"

type Props = {
  value: string
  loading: boolean
  error: string | null
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

export const AnswerForm = ({ value, loading, error, textareaRef, onChange, onSubmit }: Props) => (
  <div className="space-y-3">
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit() }}
      placeholder="Напиши свой ответ..."
      rows={4}
    />
    
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-3)" }}>⌘ Enter</span>
      <Button onClick={onSubmit} disabled={!value.trim() || loading}>
        {loading ? "Проверяю..." : "Ответить →"}
      </Button>
    </div>
    {error && <ErrorMessage message={error} />}
  </div>
)

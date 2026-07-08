import { LevelPracticePage } from "@/widgets/level-practice/ui/level-practice-page"

export default async function Page({ params }: { params: Promise<{ id: string; name: string; level: string }> }) {
  const { id, name, level } = await params
  return <LevelPracticePage topicId={id} subtopicName={decodeURIComponent(name)} level={level} />
}

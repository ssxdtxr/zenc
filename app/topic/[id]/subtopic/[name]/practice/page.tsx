import { SubtopicPracticePage } from "@/widgets/subtopic-practice/ui/subtopic-practice-page"

export default async function Page({ params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params
  return <SubtopicPracticePage topicId={id} subtopicName={decodeURIComponent(name)} />
}

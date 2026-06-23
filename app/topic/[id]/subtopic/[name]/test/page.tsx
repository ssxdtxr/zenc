import { SubtopicTestPage } from "@/widgets/subtopic-test/ui/subtopic-test-page"

export default async function Page({ params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params
  return <SubtopicTestPage topicId={id} subtopicName={decodeURIComponent(name)} />
}

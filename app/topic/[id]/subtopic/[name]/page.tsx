import { TheoryPage } from "@/widgets/theory-page/ui/theory-page"

export default async function Page({ params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params
  return <TheoryPage topicId={id} subtopicName={decodeURIComponent(name)} />
}

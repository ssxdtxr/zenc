import { SubtopicTestPage } from "@/widgets/subtopic-test/ui/subtopic-test-page"

export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params
  return <SubtopicTestPage topicId={id} subtopicName={decodeURIComponent(name)} />
}

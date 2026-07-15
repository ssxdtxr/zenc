import { LevelSessionPage } from "@/widgets/level-session/ui/level-session-page"

export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string; name: string; level: string }> }) {
  const { id, name, level } = await params
  return <LevelSessionPage topicId={id} subtopicName={decodeURIComponent(name)} level={level} />
}

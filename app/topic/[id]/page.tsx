import { TopicPage } from "@/widgets/topic-page/ui/topic-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TopicPage id={id} />
}

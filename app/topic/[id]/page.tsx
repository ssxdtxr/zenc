import { TopicPage } from "@/widgets/topic-page/ui/topic-page"

export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TopicPage id={id} />
}

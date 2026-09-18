import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function PromptPage({ params }: Props) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/analysis?step=3`);
}

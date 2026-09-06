import LiveGame from "@/components/LiveGame";

export default async function LiveGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveGame gameId={id} />;
}

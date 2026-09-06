import AdminGame from "@/components/AdminGame";

export default async function AdminGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminGame gameId={id} />;
}

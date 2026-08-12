import { permanentRedirect } from "next/navigation";

export default async function LegacyCrmPath({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  permanentRedirect(`/admin/${path.join("/")}`);
}

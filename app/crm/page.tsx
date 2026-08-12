import { permanentRedirect } from "next/navigation";

export default async function LegacyCrmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  });
  permanentRedirect(`/admin${query.size ? `?${query.toString()}` : ""}`);
}

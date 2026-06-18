import { GuestEditionReader } from "@/modules/guest-editions/components/GuestEditionReader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/invite/${token}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { title: "Lecture invitée", robots: "noindex,nofollow" };
    const data = await res.json();
    return {
      title: data.edition.titre,
      description: `Lisez gratuitement : ${data.edition.titre}`,
      robots: "noindex,nofollow",
    };
  } catch {
    return { title: "Lecture invitée", robots: "noindex,nofollow" };
  }
}

export default async function GuestReaderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <GuestEditionReader token={token} />
    </div>
  );
}

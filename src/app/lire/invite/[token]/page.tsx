import { GuestEditionReader } from "@/modules/guest-editions/components/GuestEditionReader";
import { getGuestEditionByToken } from "@/modules/guest-editions/guestEditionService";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const slot = await getGuestEditionByToken(token);
    if (!slot?.edition) return { title: "Lecture invitée", robots: "noindex,nofollow" };
    return {
      title: slot.edition.titre,
      description: `Lisez gratuitement : ${slot.edition.titre}`,
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

  let initialJournalTypeName: string | null = null;
  try {
    const slot = await getGuestEditionByToken(token);
    initialJournalTypeName = slot?.edition?.journalType?.name ?? null;
  } catch {}

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <GuestEditionReader token={token} initialJournalTypeName={initialJournalTypeName} />
    </div>
  );
}

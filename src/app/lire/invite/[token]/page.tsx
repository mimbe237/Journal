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
    if (!res.ok) return { title: "Lecture invitée" };
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
      {/* Bandeau de conversion */}
      <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between text-sm shrink-0">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Vous lisez une édition gratuite
        </span>
        <a
          href="/abonnement"
          className="bg-white text-emerald-700 font-semibold px-3 py-1 rounded-full text-xs hover:bg-emerald-50 transition-colors"
        >
          S'abonner →
        </a>
      </div>

      {/* Lecteur */}
      <div className="flex-1">
        <GuestEditionReader token={token} />
      </div>
    </div>
  );
}

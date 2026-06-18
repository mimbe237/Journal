import { headers } from "next/headers";
import { Header } from "./Header";

export async function GuestAwareHeader() {
  const headersList = await headers();
  const isGuestView = headersList.get("x-guest-view") === "1";

  if (isGuestView) return null;

  return <Header />;
}

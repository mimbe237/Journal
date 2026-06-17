import { redirect } from "next/navigation";

// Compatibilité : redirige /subscriptions/new vers la page d'offres principale.
export default function NewSubscriptionRedirect() {
  redirect("/subscriptions");
}

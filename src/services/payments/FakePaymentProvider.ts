import crypto from "crypto";
import { CheckoutSession, CreateCheckoutSessionInput, PaymentProvider } from "./PaymentProvider";

// Provider fictif : génère une session et renvoie une URL locale pour simuler le paiement.
export class FakePaymentProvider implements PaymentProvider {
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    const sessionId = crypto.randomUUID();
    const search = new URLSearchParams({ sessionId, reference: input.reference }).toString();
    const checkoutUrl = `/payments/fake?${search}`;
    return { sessionId, checkoutUrl };
  }
}

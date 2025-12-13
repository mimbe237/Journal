import { FakePaymentProvider } from "./FakePaymentProvider";
import type { PaymentProvider } from "./PaymentProvider";

// Permet de remplacer facilement par Stripe/PayPal plus tard.
const providerName = process.env.PAYMENT_PROVIDER?.toLowerCase() ?? "fake";

let provider: PaymentProvider;

switch (providerName) {
  case "fake":
  default:
    provider = new FakePaymentProvider();
    break;
}

export const paymentProvider = provider;

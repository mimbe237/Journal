export type CheckoutSession = {
  sessionId: string;
  checkoutUrl: string;
};

export type CreateCheckoutSessionInput = {
  reference: string;
  amount: number;
  currency: string;
  userEmail?: string;
};

export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;
}

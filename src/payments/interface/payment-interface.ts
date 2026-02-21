export interface PaymentMethodInput {
  type: 'card' | 'bank' | 'paypal';
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  stripePaymentMethodId?: string;
}

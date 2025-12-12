import Stripe from 'stripe';

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' as any });
}
// Mock payment adapter — same shape a real Stripe integration would have,
// so swapping one in later only touches this file. The last stub standing:
// generation and fulfilment (lib/printify) are both wired to real services now.

export type ChargeInput = {
  amountCents: number
  buyerId: string
  designId: string
}

export type ChargeResult = {
  paymentRef: string
  status: "succeeded"
}

export async function charge(input: ChargeInput): Promise<ChargeResult> {
  void input
  return {
    paymentRef: `mock_pi_${crypto.randomUUID()}`,
    status: "succeeded",
  }
}

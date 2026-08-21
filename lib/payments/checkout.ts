// Mock payment adapter, still standing in for garment orders — same shape a
// real processor integration has, so swapping one in only touches this file.
// Design purchases charge through Bolt (lib/payments/bolt.ts) for real. The last stub standing:
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

import { NextRequest, NextResponse } from 'next/server';

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;       // in kobo
    currency: string;
    customer: { email: string; first_name?: string; last_name?: string };
    paid_at: string;
    metadata?: Record<string, unknown>;
  };
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
      },
    );
  } catch {
    return NextResponse.json({ error: 'Could not reach Paystack' }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Paystack API error', verified: false }, { status: 502 });
  }

  const json = (await res.json()) as PaystackVerifyResponse;

  if (json.status && json.data.status === 'success') {
    return NextResponse.json({
      verified:  true,
      reference: json.data.reference,
      amount:    json.data.amount,     // kobo
      currency:  json.data.currency,
      paidAt:    json.data.paid_at,
    });
  }

  return NextResponse.json(
    { verified: false, status: json.data?.status ?? 'unknown' },
    { status: 400 },
  );
}

import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Verify HMAC signature
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY not set');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 },
    );
  }

  const expected = createHmac('sha512', secret).update(body).digest('hex');

  console.log(expected, 'expected');

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  switch (event.event) {
    case 'charge.success':
      // TODO: persist order to DB, send confirmation email
      console.log(
        '[Paystack] charge.success — ref:',
        event.data.reference,
        '— amount:',
        event.data.amount,
      );
      break;

    case 'transfer.success':
    case 'transfer.failed':
    case 'transfer.reversed':
      console.log('[Paystack]', event.event, '— ref:', event.data.reference);
      break;

    default:
      // Unhandled event type — acknowledge receipt anyway
      break;
  }

  return NextResponse.json({ received: true });
}

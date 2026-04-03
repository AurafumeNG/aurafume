import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;       // in kobo
    currency: string;
    customer: { email: string };
    paid_at?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  // ── HMAC verification ──────────────────────────────────────────────────────
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const secret    = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const expected = createHmac('sha512', secret).update(body).digest('hex');

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────
  switch (event.event) {

    case 'charge.success': {
      const { reference, amount, paid_at } = event.data;
      console.log('[Paystack] charge.success — ref:', reference, '— amount (kobo):', amount);

      try {
        await connectDB();

        const updated = await Order.findOneAndUpdate(
          { 'payment.paystackRef': reference },
          {
            $set: {
              'payment.status':    'paid',
              'payment.paidAt':    paid_at ? new Date(paid_at) : new Date(),
              'payment.amountPaid': Math.round(amount / 100), // kobo → Naira
              status:              'confirmed',
            },
          },
          { new: true },
        );

        if (!updated) {
          // Order may not exist yet if the webhook fires before order creation (race condition).
          // This is safe to ignore — place-order-cta creates the order first, then opens Paystack.
          console.warn('[Paystack Webhook] No order found for ref:', reference);
        } else {
          console.log('[Paystack Webhook] Order confirmed:', updated.orderNumber);
        }
      } catch (err) {
        console.error('[Paystack Webhook] DB update failed:', err);
        // Still return 200 so Paystack doesn't retry endlessly
      }
      break;
    }

    case 'transfer.success':
    case 'transfer.failed':
    case 'transfer.reversed':
      console.log('[Paystack]', event.event, '— ref:', event.data.reference);
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

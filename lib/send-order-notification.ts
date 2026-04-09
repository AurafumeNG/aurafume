/**
 * sendOrderStatusNotification
 *
 * Called whenever an admin changes an order's status.
 * Respects the customer's notification preferences:
 *   - email.orderUpdates  → sends a branded status-change email
 *   - push.enabled + push.orderStatusChanges → sends a web push notification
 *
 * Guest orders (no userId) always receive the email; push is silently skipped.
 */

import webpush                     from 'web-push';
import connectDB                   from '@/lib/mongodb';
import User                        from '@/models/User';
import PushSubscriptionModel       from '@/models/PushSubscription';
import { sendOrderStatusEmail }    from '@/lib/email';

// ── VAPID configuration ───────────────────────────────────────────────────────

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// ── Push payload copy per status ──────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const PUSH_COPY: Record<OrderStatus, { title: string; body: string }> = {
  pending:    { title: 'Order Received',       body: 'We\'ve received your order and it\'s being reviewed.' },
  confirmed:  { title: 'Order Confirmed',      body: 'Your order has been confirmed and will be prepared shortly.' },
  processing: { title: 'Order Being Prepared', body: 'Our team is carefully packing your fragrances.' },
  shipped:    { title: 'Order Shipped 🚚',     body: 'Great news — your order is on its way!' },
  delivered:  { title: 'Order Delivered ✓',   body: 'Your AuraFume order has arrived. Enjoy!' },
  cancelled:  { title: 'Order Cancelled',      body: 'Your order has been cancelled. Contact us if you need help.' },
};

// ── Public interface ──────────────────────────────────────────────────────────

export interface OrderNotificationPayload {
  orderId:          string;
  orderNumber:      string;
  /** Undefined for guest orders */
  userId?:          string;
  contactEmail:     string;
  contactFirstName: string;
  newStatus:        OrderStatus;
  items:            Array<{ name: string; qty: number }>;
  total:            number;
}

export async function sendOrderStatusNotification(data: OrderNotificationPayload) {
  await connectDB();

  const {
    orderId, orderNumber, userId, contactEmail,
    contactFirstName, newStatus, items, total,
  } = data;

  // ── Resolve notification preferences ─────────────────────────────────────
  let emailEnabled = true;   // default: always email guest orders
  let pushEnabled  = false;

  if (userId) {
    const user = await User.findById(userId).select('notificationPreferences').lean();
    if (user?.notificationPreferences) {
      const prefs = user.notificationPreferences;
      emailEnabled = prefs.email?.orderUpdates ?? true;
      pushEnabled  = (prefs.push?.enabled ?? false) &&
                     (prefs.push?.orderStatusChanges ?? true);
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (emailEnabled) {
    try {
      await sendOrderStatusEmail({
        email:       contactEmail,
        firstName:   contactFirstName,
        orderNumber,
        status:      newStatus,
        items,
        total,
      });
    } catch (err) {
      console.error('[sendOrderStatusNotification] Email failed:', err);
    }
  }

  // ── Web push ──────────────────────────────────────────────────────────────
  if (pushEnabled && userId) {
    try {
      const subscriptions = await PushSubscriptionModel.find({ userId }).lean();

      if (subscriptions.length === 0) return;

      const copy    = PUSH_COPY[newStatus];
      const payload = JSON.stringify({
        title: `${copy.title} — ${orderNumber}`,
        body:  copy.body,
        icon:  '/icons/icon-192x192.png',
        data:  { url: `/account/orders` },
      });

      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
            payload,
          ),
        ),
      );

      // Clean up expired / invalid subscriptions (410 Gone, 404 Not Found)
      await Promise.all(
        results.map(async (result, i) => {
          if (result.status === 'rejected') {
            const err = result.reason as { statusCode?: number };
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await PushSubscriptionModel.deleteOne({ _id: subscriptions[i]._id });
            }
          }
        }),
      );
    } catch (err) {
      console.error('[sendOrderStatusNotification] Push failed:', err);
    }
  }

  // Suppress unused variable warning (orderId reserved for future deep-link use)
  void orderId;
}

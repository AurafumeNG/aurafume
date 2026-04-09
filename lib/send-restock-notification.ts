/**
 * sendRestockNotification
 *
 * Fired when a product variant goes from 0 → positive stock.
 * Notifies every user who:
 *   - Has the product in their wishlist, AND
 *   - Has email.restockedItems enabled  (→ receives an email), OR
 *   - Has push.enabled + push.restockedItems enabled (→ receives a push)
 *
 * Uses fire-and-forget Promise.allSettled throughout so one failed
 * delivery never aborts the rest.
 */

import webpush                    from 'web-push';
import connectDB                  from '@/lib/mongodb';
import User                       from '@/models/User';
import PushSubscriptionModel      from '@/models/PushSubscription';
import { sendRestockEmail }       from '@/lib/email';

// ── VAPID configuration (lazy — only called at request time, not build time) ──

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface RestockNotificationPayload {
  productId:   string;
  productName: string;
  productSlug: string;
  /** First image CDN URL — included in push icon and email hero */
  imageUrl?:   string;
  variantSize: string;
}

export async function sendRestockNotification(data: RestockNotificationPayload) {
  await connectDB();

  const { productId, productName, productSlug, imageUrl, variantSize } = data;

  // Find users who wishlisted this product
  const users = await User.find(
    { wishlist: productId },
    { _id: 1, firstName: 1, email: 1, notificationPreferences: 1 },
  ).lean();

  if (users.length === 0) return;

  // ── Sort users into email targets vs push targets ─────────────────────────

  const emailTargets: Array<{ email: string; firstName: string }> = [];
  const pushUserIds:  string[] = [];

  for (const user of users) {
    const prefs = user.notificationPreferences;

    // Email: default on (true) if the field is missing (new pref for existing users)
    if (prefs?.email?.restockedItems ?? true) {
      emailTargets.push({ email: user.email, firstName: user.firstName });
    }

    // Push: master toggle must be on AND restockedItems must be on
    const pushOn     = prefs?.push?.enabled          ?? false;
    const restockOn  = prefs?.push?.restockedItems   ?? true;
    if (pushOn && restockOn) {
      pushUserIds.push(String(user._id));
    }
  }

  // ── Emails ────────────────────────────────────────────────────────────────

  if (emailTargets.length > 0) {
    await Promise.allSettled(
      emailTargets.map(({ email, firstName }) =>
        sendRestockEmail({ email, firstName, productName, productSlug, imageUrl, variantSize })
          .catch((err) => console.error('[restock email] failed for', email, err)),
      ),
    );
  }

  // ── Web push ──────────────────────────────────────────────────────────────

  if (pushUserIds.length > 0) {
    initVapid();
    const pushPayload = JSON.stringify({
      title: `Back in Stock — ${productName}`,
      body:  `Your ${variantSize} is available again. Tap to shop before it sells out.`,
      icon:  imageUrl ?? '/icons/icon-192x192.png',
      data:  { url: `/shop/${productSlug}` },
    });

    await Promise.allSettled(
      pushUserIds.map(async (userId) => {
        const subscriptions = await PushSubscriptionModel.find({ userId }).lean();

        await Promise.allSettled(
          subscriptions.map(async (sub) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys:     { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
                },
                pushPayload,
              );
            } catch (err) {
              const e = err as { statusCode?: number };
              // Clean up dead subscriptions automatically
              if (e?.statusCode === 410 || e?.statusCode === 404) {
                await PushSubscriptionModel.deleteOne({ _id: sub._id });
              }
            }
          }),
        );
      }),
    );
  }
}

import { revalidatePath } from 'next/cache';

/**
 * Refreshes the prerendered pages that read products straight from the database,
 * so admin edits show up without waiting for the 60s ISR window or a redeploy.
 */
export function revalidateStorefront(slug?: string) {
  revalidatePath('/');
  revalidatePath('/about');
  if (slug) revalidatePath(`/shop/${slug}`);
}

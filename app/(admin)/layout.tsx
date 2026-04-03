// Admin section layout — visually isolated from the customer-facing storefront.
// Renders a full-screen dark overlay so the root layout background is hidden.
export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-auto"
      style={{ background: '#0F0F0F' }}
    >
      {children}
    </div>
  );
}

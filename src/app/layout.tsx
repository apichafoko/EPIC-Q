// Root Layout requerido por Next.js App Router
// Este layout es necesario para que Vercel pueda hacer el build correctamente
// Solo pasa children, las etiquetas HTML están en [locale]/layout.tsx

// Forzar rendering dinámico para toda la app
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

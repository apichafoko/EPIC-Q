import { InstallPrompt } from '../../../components/pwa/install-prompt';
import { OfflineIndicator } from '../../../components/pwa/offline-indicator';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}

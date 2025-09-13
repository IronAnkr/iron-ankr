import { FancyBackground } from "../components/admin/fancy-background";
import { AdminContainer } from "../components/admin/admin-container";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="system-theme relative flex flex-col min-h-screen pt-24 bg-background text-foreground overflow-x-hidden">
      <FancyBackground />
      <main className="relative z-10 flex-1 py-6 lg:py-8">
        <AdminContainer>{children}</AdminContainer>
      </main>
    </div>
  );
}

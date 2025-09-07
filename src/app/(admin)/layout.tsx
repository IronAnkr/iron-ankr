import AdminNavbar from "../components/admin/admin-navbar";
import { FancyBackground } from "../components/admin/fancy-background";
import { AdminContainer } from "../components/admin/admin-container";
import { AdminBreadcrumbs } from "../components/admin/breadcrumbs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex flex-col min-h-screen pt-24 bg-black text-white overflow-x-hidden">
      <FancyBackground />
      <AdminNavbar />
      <main className="relative z-10 flex-1 py-4 md:py-6 lg:py-8">
        <AdminContainer>
          <AdminBreadcrumbs />
          {children}
        </AdminContainer>
      </main>
    </div>
  );
}

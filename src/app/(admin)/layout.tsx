import AdminNavbar from "../components/admin/admin-navbar";
import { FancyBackground } from "../components/admin/fancy-background";
import { AdminBreadcrumbs } from "../components/admin/breadcrumbs";
import { AdminSidebar } from "../components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex flex-col min-h-screen pt-24 bg-black text-white overflow-x-hidden">
      <FancyBackground />
      <AdminNavbar />
      <main className="relative z-10 flex-1 py-4 md:py-6 lg:py-8">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
          {/* Place breadcrumbs above the grid so both sidebar and content shift uniformly */}
          <AdminBreadcrumbs />
          <div className="flex gap-6">
            {/* Sidebar (desktop) */}
            <AdminSidebar />
            {/* Content area */}
            <div className="min-w-0 flex-1">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

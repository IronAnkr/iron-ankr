"use client";
import { BannersTable } from "@/app/components/admin/banners/banners-table";

export default function AdminBannersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Banner Messages</h1>
          <p className="text-sm text-muted-foreground">Create small announcements shown beneath the site navbar.</p>
        </div>
      </header>
      <BannersTable />
    </div>
  );
}


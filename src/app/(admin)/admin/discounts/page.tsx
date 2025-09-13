"use client";
import { DiscountsTable } from "@/app/components/admin/discounts/discounts-table";

export default function AdminDiscountsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Discounts</h1>
          <p className="text-sm text-muted-foreground">Create, edit, enable/disable, and remove promo codes.</p>
        </div>
      </header>
      <DiscountsTable />
    </div>
  );
}

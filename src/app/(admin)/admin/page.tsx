
import { PageAnalytics } from "@/app/components/admin/page-analytics";
import { OrdersNeedingFulfillment } from "@/app/components/admin/orders-needing-fulfillment";
import { RecentActivity } from "@/app/components/admin/recent-activity";
import { OverviewChart } from "@/app/components/admin/overview-chart";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Key metrics, orders, and recent activity.</p>
      </header>
      <PageAnalytics />
      <OverviewChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrdersNeedingFulfillment />
        <RecentActivity />
      </div>
    </div>
  );
}

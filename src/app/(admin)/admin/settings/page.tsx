import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure store details, payments, and fulfillment.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Store</CardTitle>
            <CardDescription>Basic information for your storefront.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Store name</span>
                <input className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="Acme Co." />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Support email</span>
                <input className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="support@example.com" />
              </label>
              <div className="flex justify-end">
                <button type="button" className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Save changes</button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
            <CardDescription>Default shipping speeds and rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Domestic flat rate</span>
                <input className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="$5.00" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-white/90">International flat rate</span>
                <input className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="$15.00" />
              </label>
              <div className="flex justify-end">
                <button type="button" className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Save shipping</button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Permanently remove data. This action cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <div className="font-medium">Reset demo data</div>
                <div className="text-sm text-muted-foreground">Clears orders, products, and activity.</div>
              </div>
              <button className="rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 transition">Reset</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

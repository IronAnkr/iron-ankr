import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
          <p className="text-sm text-muted-foreground">Track, search, and manage recent orders.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/80">
          <span className="px-2 py-1 rounded bg-white/10">Today: 42</span>
          <span className="px-2 py-1 rounded bg-white/10">Pending: 7</span>
          <span className="px-2 py-1 rounded bg-white/10">Unfulfilled: 3</span>
        </div>
      </header>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
          <CardDescription>Newest orders appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1,2,3,4,5,6].map((i) => (
                <TableRow key={i}>
                  <TableCell>#10{i}24</TableCell>
                  <TableCell className="hidden md:table-cell">Customer {i}</TableCell>
                  <TableCell>
                    <Badge variant={i % 3 === 0 ? "secondary" : i % 2 === 0 ? "outline" : "default"} className="text-xs">
                      {i % 3 === 0 ? "Fulfilled" : i % 2 === 0 ? "Pending" : "Paid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">2025-09-0{i}</TableCell>
                  <TableCell className="text-right">${(i * 43).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

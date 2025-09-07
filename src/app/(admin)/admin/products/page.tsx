import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage inventory, pricing, and visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Add Product</button>
        </div>
      </header>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>Overview of active products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["Carbon Strap","Titanium Strap","Steel Strap","Leather Strap"].map((name, idx) => (
                <TableRow key={name}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="hidden md:table-cell">SKU-{1000+idx}</TableCell>
                  <TableCell>{idx % 2 === 0 ? "Active" : "Draft"}</TableCell>
                  <TableCell className="hidden md:table-cell">${(79+idx*10).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{idx % 2 === 0 ? 120-idx*10 : 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

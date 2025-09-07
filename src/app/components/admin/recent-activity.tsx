import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

type Item = {
  initials: string;
  name: string;
  email: string;
  amount: string;
};

const items: Item[] = [
  { initials: "OM", name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00" },
  { initials: "JL", name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00" },
  { initials: "AS", name: "Ava Stone", email: "ava.stone@email.com", amount: "+$249.00" },
  { initials: "DP", name: "Diego Park", email: "diego.park@email.com", amount: "+$129.00" },
];

export function RecentActivity() {
  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription>Latest customers and order amounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/10" />
          <ul className="space-y-6">
            {items.map((i, idx) => (
              <li key={idx} className="relative flex items-center gap-4">
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                  {i.initials}
                </div>
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium leading-none text-white">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.email}</p>
                </div>
                <div className="ml-auto text-sm font-medium text-white/90">{i.amount}</div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

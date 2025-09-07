import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Sparkline } from "./sparkline";

const cards = [
  {
    title: "Revenue",
    value: "$45,231.89",
    delta: "+20.1%",
    color: "from-emerald-400/20 to-emerald-400/0",
    data: [35, 30, 32, 31, 40, 38, 44, 50],
  },
  {
    title: "Subscriptions",
    value: "+2,350",
    delta: "+180.1%",
    color: "from-sky-400/20 to-sky-400/0",
    data: [5, 6, 7, 8, 10, 12, 15, 23],
  },
  {
    title: "Sales",
    value: "+12,234",
    delta: "+19%",
    color: "from-violet-400/20 to-violet-400/0",
    data: [12, 10, 11, 13, 12, 14, 17, 19],
  },
  {
    title: "Active Now",
    value: "+573",
    delta: "+201",
    color: "from-pink-400/20 to-pink-400/0",
    data: [20, 18, 25, 22, 27, 35, 30, 33],
  },
];

export function PageAnalytics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} className="relative overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className={`absolute inset-x-0 -top-12 h-24 bg-gradient-to-b ${c.color}`} />
          <CardHeader className="relative">
            <CardTitle className="text-sm text-white/80">{c.title}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-white">{c.value}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white">
                  <span>{c.delta}</span>
                  <span className="text-white/60">vs last month</span>
                </div>
              </div>
              <div className="h-12 w-24 opacity-90">
                <Sparkline values={c.data} colorClass="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactPrice, formatPrice } from "@/lib/utils";

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="h-72" role="img" aria-label={`Revenue by month: ${data.map((d) => `${d.month} ${formatPrice(d.revenue)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C49A5A" stopOpacity={0.35} /><stop offset="100%" stopColor="#C49A5A" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#e3e1da" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#697586", fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCompactPrice(v)} tickLine={false} axisLine={false} tick={{ fill: "#697586", fontSize: 12 }} width={64} />
          <Tooltip formatter={(v) => [formatPrice(Number(v)), "Revenue"]} contentStyle={{ border: "1px solid #e3e1da", borderRadius: 2, fontSize: 12 }} />
          <Area type="monotone" dataKey="revenue" stroke="#C49A5A" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-72" role="img" aria-label={`Counts: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
          <CartesianGrid stroke="#e3e1da" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#697586", fontSize: 12 }} />
          <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} tick={{ fill: "#10151C", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "rgba(16,21,28,0.04)" }} contentStyle={{ border: "1px solid #e3e1da", borderRadius: 2, fontSize: 12 }} />
          <Bar dataKey="count" fill="#10151C" barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

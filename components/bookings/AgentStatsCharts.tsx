"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AgentStatsRow } from "@/lib/actions/booking.actions";

type Props = {
  perAgent: AgentStatsRow[];
  serviceBreakdown: Record<string, number>;
};

const SERVICE_COLORS = [
  "#38bdf8",
  "#fbbf24",
  "#fb923c",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#94a3b8",
];

const STATUS_COLORS = {
  confirmed: "#34d399",
  pending: "#fbbf24",
  declined: "#f87171",
};

const SERVICE_LABELS: Record<string, string> = {
  "day-use": "Day Use",
  "kitesurfing-course": "Kitesurfing",
  restaurant: "Restaurant",
  "pharaoh-airstyle": "Pharaoh",
};

function serviceLabel(value: string) {
  return SERVICE_LABELS[value] ?? value;
}

export function AgentStatsCharts({ perAgent, serviceBreakdown }: Props) {
  const stackedData = perAgent
    .filter((a) => a.touched > 0)
    .map((a) => ({
      name: a.name,
      confirmed: a.confirmedCount,
      pending: a.pendingCount,
      declined: a.declinedCount,
    }));

  const donutData = Object.entries(serviceBreakdown)
    .map(([service, count]) => ({ name: serviceLabel(service), value: count }))
    .sort((a, b) => b.value - a.value);

  const noData = perAgent.every((a) => a.touched === 0);

  if (noData) {
    return (
      <div className="bg-white border border-[#ece8e3] p-10 text-center font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#8a8480]">
        No bookings in this range yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Stacked status bar per agent */}
      <div className="bg-white border border-[#ece8e3] p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-7 shrink-0 bg-[#1a1614]" />
          <span className="text-[0.58rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[700] text-[#1a1614]">
            Status breakdown
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(220, stackedData.length * 40)}>
          <BarChart
            data={stackedData}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#8a8480" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#1a1614" }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: "#f5f4f1" }}
              contentStyle={{
                fontSize: 12,
                border: "1px solid #ece8e3",
                background: "#fff",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="confirmed"
              stackId="a"
              fill={STATUS_COLORS.confirmed}
              name="Confirmed"
            />
            <Bar
              dataKey="pending"
              stackId="a"
              fill={STATUS_COLORS.pending}
              name="Pending"
            />
            <Bar
              dataKey="declined"
              stackId="a"
              fill={STATUS_COLORS.declined}
              name="Declined"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service mix donut */}
      <div className="bg-white border border-[#ece8e3] p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-7 shrink-0 bg-[#38bdf8]" />
          <span className="text-[0.58rem] tracking-[0.28em] uppercase font-[family-name:var(--font-raleway)] font-[700] text-[#38bdf8]">
            Service mix
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
            >
              {donutData.map((_, i) => (
                <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: "1px solid #ece8e3",
                background: "#fff",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  perDay: { day: number; confirmedPeople: number }[];
};

export function DayUseReportChart({ perDay }: Props) {
  const hasData = perDay.some((d) => d.confirmedPeople > 0);

  if (!hasData) {
    return (
      <div className="bg-white border border-[#ece8e3] p-5">
        <div className="flex h-[260px] items-center justify-center">
          <p className="font-[family-name:var(--font-raleway)] text-[0.7rem] tracking-[0.08em] uppercase text-[#b0a89f]">
            No day-use bookings this month
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ece8e3] p-5">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={perDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#8a8480" }}
            tickLine={false}
            axisLine={{ stroke: "#ece8e3" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#8a8480" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "#faf9f7" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #ece8e3",
              fontSize: 12,
            }}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Bar name="Confirmed guests" dataKey="confirmedPeople" fill="#15803d" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

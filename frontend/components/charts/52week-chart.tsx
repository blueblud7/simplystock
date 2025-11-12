"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 임시 히스토리 데이터
const data = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}일`,
  신고가: Math.floor(Math.random() * 100) + 50,
  신저가: Math.floor(Math.random() * 50) + 10,
}));

export function Week52Chart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="신고가" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="신저가" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}


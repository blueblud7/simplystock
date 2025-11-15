"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface HistoryData {
  date: string;
  highs_count: number;
  lows_count: number;
}

export function Week52Chart() {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/52week/history?days=30");
        const result = await response.json();
        
        if (result.history) {
          // 데이터를 차트 형식으로 변환
          const chartData = result.history.map((item: any) => ({
            date: item.date.substring(5), // YYYY-MM-DD -> MM-DD
            신고가: item.highs_count,
            신저가: item.lows_count
          }));
          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch 52-week history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">데이터가 없습니다</p>
      </div>
    );
  }

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


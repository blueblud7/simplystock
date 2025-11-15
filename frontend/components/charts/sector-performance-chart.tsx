"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const colors: Record<string, string> = {
  기술: "#3b82f6",
  금융: "#10b981",
  헬스케어: "#f59e0b",
  에너지: "#ef4444",
  통신: "#8b5cf6",
  소비재: "#ec4899",
  산업재: "#06b6d4",
  유틸리티: "#84cc16",
  부동산: "#a855f7",
  소재: "#f97316",
  필수소비재: "#14b8a6",
};

export function SectorPerformanceChart() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 각 기간별로 데이터 가져오기
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          fetch("http://localhost:8001/api/sectors/history?days=30"),
          fetch("http://localhost:8001/api/sectors/history?days=90"),
          fetch("http://localhost:8001/api/sectors/history?days=365")
        ]);

        const dailyJson = await dailyRes.json();
        const weeklyJson = await weeklyRes.json();
        const monthlyJson = await monthlyRes.json();

        if (dailyJson.history) {
          setDailyData(dailyJson.history.map((item: any) => ({
            ...item,
            date: item.date.substring(5) // YYYY-MM-DD -> MM-DD
          })));
        }

        if (weeklyJson.history) {
          // 주별로 샘플링 (7일마다)
          const weeklyFiltered = weeklyJson.history.filter((_: any, i: number) => i % 7 === 0);
          setWeeklyData(weeklyFiltered.map((item: any) => ({
            ...item,
            date: item.date.substring(5)
          })));
        }

        if (monthlyJson.history) {
          // 월별로 샘플링 (30일마다)
          const monthlyFiltered = monthlyJson.history.filter((_: any, i: number) => i % 30 === 0);
          setMonthlyData(monthlyFiltered.map((item: any) => ({
            ...item,
            date: item.date.substring(5, 7) + '월' // YYYY-MM-DD -> MM월
          })));
        }
      } catch (error) {
        console.error("Failed to fetch sector history:", error);
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

  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="daily">일별 (30일)</TabsTrigger>
        <TabsTrigger value="weekly">주별 (90일)</TabsTrigger>
        <TabsTrigger value="monthly">월별 (1년)</TabsTrigger>
      </TabsList>
      
      <TabsContent value="daily" className="mt-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {Object.entries(colors).map(([name, color]) => (
              <Line 
                key={name}
                type="monotone" 
                dataKey={name} 
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="weekly" className="mt-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {Object.entries(colors).map(([name, color]) => (
              <Line 
                key={name}
                type="monotone" 
                dataKey={name} 
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="monthly" className="mt-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {Object.entries(colors).map(([name, color]) => (
              <Line 
                key={name}
                type="monotone" 
                dataKey={name} 
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}


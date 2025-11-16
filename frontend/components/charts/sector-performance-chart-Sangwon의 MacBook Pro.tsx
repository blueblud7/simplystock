"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const colors = {
  "기술": "#3b82f6",
  "금융": "#10b981",
  "헬스케어": "#f59e0b",
  "에너지": "#ef4444",
  "통신": "#8b5cf6",
};

export function SectorPerformanceChart() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 5일, 1개월, 1년 데이터 가져오기
        const [daily, monthly, yearly] = await Promise.all([
          fetch("http://localhost:8001/api/sectors/history?period=5d").then(r => r.json()),
          fetch("http://localhost:8001/api/sectors/history?period=1mo").then(r => r.json()),
          fetch("http://localhost:8001/api/sectors/history?period=1y").then(r => r.json()),
        ]);

        setDailyData(daily.data || []);
        setWeeklyData(monthly.data || []);
        setMonthlyData(yearly.data || []);
      } catch (error) {
        console.error("Failed to fetch sector history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="daily">5일</TabsTrigger>
        <TabsTrigger value="weekly">1개월</TabsTrigger>
        <TabsTrigger value="monthly">1년</TabsTrigger>
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


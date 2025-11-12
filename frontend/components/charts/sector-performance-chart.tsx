"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 임시 히스토리 데이터
const dailyData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}일`,
  기술: Math.random() * 5 - 1,
  금융: Math.random() * 4 - 1,
  헬스케어: Math.random() * 3,
  에너지: Math.random() * 4 - 2,
  통신: Math.random() * 4,
}));

const weeklyData = Array.from({ length: 12 }, (_, i) => ({
  date: `${i + 1}주`,
  기술: Math.random() * 15 - 3,
  금융: Math.random() * 12 - 2,
  헬스케어: Math.random() * 10,
  에너지: Math.random() * 12 - 5,
  통신: Math.random() * 12,
}));

const monthlyData = Array.from({ length: 12 }, (_, i) => ({
  date: `${i + 1}월`,
  기술: Math.random() * 30 - 5,
  금융: Math.random() * 25 - 3,
  헬스케어: Math.random() * 20,
  에너지: Math.random() * 25 - 10,
  통신: Math.random() * 25,
}));

const colors = {
  기술: "#3b82f6",
  금융: "#10b981",
  헬스케어: "#f59e0b",
  에너지: "#ef4444",
  통신: "#8b5cf6",
};

export function SectorPerformanceChart() {
  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="daily">일별</TabsTrigger>
        <TabsTrigger value="weekly">주별</TabsTrigger>
        <TabsTrigger value="monthly">월별</TabsTrigger>
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


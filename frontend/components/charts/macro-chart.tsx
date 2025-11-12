"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

// 임시 히스토리 데이터
const fearGreedData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}일`,
  value: 50 + Math.random() * 30 - 10,
}));

const interestRateData = Array.from({ length: 12 }, (_, i) => ({
  date: `${i + 1}월`,
  "연준 기준금리": 5.5 - (i * 0.1),
  "10년물": 4.5 - (i * 0.08),
  "2년물": 4.8 - (i * 0.09),
}));

const vixData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}일`,
  VIX: 15 + Math.random() * 10 - 5,
}));

const exchangeRateData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}일`,
  "USD/KRW": 1300 + Math.random() * 20,
  "DXY": 104 + Math.random() * 2,
}));

export function MacroChart() {
  return (
    <Tabs defaultValue="fear-greed" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="fear-greed">공포/탐욕</TabsTrigger>
        <TabsTrigger value="interest">금리</TabsTrigger>
        <TabsTrigger value="vix">VIX</TabsTrigger>
        <TabsTrigger value="exchange">환율</TabsTrigger>
      </TabsList>
      
      <TabsContent value="fear-greed" className="mt-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={fearGreedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="interest" className="mt-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={interestRateData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[3, 6]} />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="연준 기준금리" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="10년물" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="2년물" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="vix" className="mt-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={vixData}>
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
            <Area 
              type="monotone" 
              dataKey="VIX" 
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="exchange" className="mt-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={exchangeRateData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" domain={[1290, 1320]} />
            <YAxis yAxisId="right" orientation="right" domain={[103, 106]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="USD/KRW" 
              stroke="#6366f1" 
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="DXY" 
              stroke="#10b981" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

interface FearGreedData {
  date: string;
  value: number;
}

interface InterestRateData {
  date: string;
  "연준 기준금리": number | null;
  "10년물": number | null;
  "2년물": number | null;
}

interface VixData {
  date: string;
  VIX: number;
}

interface ExchangeRateData {
  date: string;
  "USD/KRW": number | null;
  "DXY": number | null;
}

export function MacroChart() {
  const [fearGreedData, setFearGreedData] = useState<FearGreedData[]>([]);
  const [interestRateData, setInterestRateData] = useState<InterestRateData[]>([]);
  const [vixData, setVixData] = useState<VixData[]>([]);
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fear & Greed Index
        const fearGreedRes = await fetch("http://localhost:8001/api/macro/history/fear-greed?days=30");
        const fearGreedJson = await fearGreedRes.json();
        if (fearGreedJson.history) {
          setFearGreedData(fearGreedJson.history.map((item: any) => ({
            date: item.date,
            value: item.value
          })));
        }

        // Interest Rates
        const interestRes = await fetch("http://localhost:8001/api/macro/history/interest-rates?months=12");
        const interestJson = await interestRes.json();
        if (interestJson.history) {
          setInterestRateData(interestJson.history.map((item: any) => ({
            date: item.date,
            "연준 기준금리": item.fed_funds_rate,
            "10년물": item.treasury_10y,
            "2년물": item.treasury_2y
          })));
        }

        // VIX
        const vixRes = await fetch("http://localhost:8001/api/macro/history/vix?days=30");
        const vixJson = await vixRes.json();
        if (vixJson.history) {
          setVixData(vixJson.history.map((item: any) => ({
            date: item.date,
            VIX: item.value
          })));
        }

        // Exchange Rates
        const exchangeRes = await fetch("http://localhost:8001/api/macro/history/exchange-rates?days=30");
        const exchangeJson = await exchangeRes.json();
        if (exchangeJson.history) {
          setExchangeRateData(exchangeJson.history.map((item: any) => ({
            date: item.date,
            "USD/KRW": item.usd_krw,
            "DXY": item.dxy
          })));
        }
      } catch (error) {
        console.error("Failed to fetch macro history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">차트 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

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


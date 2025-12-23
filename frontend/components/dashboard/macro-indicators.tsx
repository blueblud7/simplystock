"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, TrendingUp, Globe } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { useEffect, useState } from "react";

interface MacroData {
  fear_greed: { value: number; label: string };
  m2: { value: number; unit: string };
  fed_funds_rate: { value: number; unit: string };
  vix: { value: number; status: string };
}

export function MacroIndicators() {
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        // 캐시 방지를 위해 timestamp 추가 및 no-cache 헤더 사용
        const response = await fetch(getApiUrl("/api/macro/overview") + `?force_refresh=true&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("매크로 데이터 업데이트:", data.indicators?.fear_greed);
        setMacroData(data.indicators || null);
      } catch (error) {
        console.error("Failed to fetch macro data:", error);
        setMacroData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
    
    // 1분마다 자동 갱신 (더 자주 업데이트)
    const interval = setInterval(fetchMacroData, 1 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading || !macroData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매크로 지표</CardTitle>
          <CardDescription>
            주요 거시경제 지표를 실시간으로 모니터링하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const indicators = [
    {
      name: "CNN Fear & Greed",
      value: macroData.fear_greed.value,
      label: macroData.fear_greed.label,
      icon: Activity,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      name: "M2 통화량",
      value: macroData.m2.value,
      label: "조 달러",
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "연준 기준금리",
      value: macroData.fed_funds_rate.value,
      label: "%",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      name: "VIX 지수",
      value: macroData.vix.value,
      label: macroData.vix.status,
      icon: Globe,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>매크로 지표</CardTitle>
        <CardDescription>
          실시간 경제 지표 (FRED API & yfinance)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {indicators.map((item) => {
            const Icon = item.icon;
            
            return (
              <div key={item.name} className="flex items-center space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.name}
                  </p>
                  <div className="flex items-baseline space-x-1">
                    <p className="text-2xl font-bold">
                      {formatNumber(item.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

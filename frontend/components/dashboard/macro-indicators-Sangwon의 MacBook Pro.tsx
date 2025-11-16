"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, TrendingUp, Globe } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MacroIndicator {
  name: string;
  value: number;
  label?: string;
  unit?: string;
  status?: string;
}

interface MacroData {
  fear_greed?: MacroIndicator & { label: string };
  m2?: MacroIndicator & { unit: string };
  fed_funds_rate?: MacroIndicator & { unit: string };
  vix?: MacroIndicator & { status: string };
}

const iconMap: Record<string, { icon: typeof Activity; color: string; bgColor: string }> = {
  "CNN Fear & Greed Index": {
    icon: Activity,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  "M2 Money Supply": {
    icon: DollarSign,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  "Federal Funds Rate": {
    icon: TrendingUp,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  "VIX Index": {
    icon: Globe,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

export function MacroIndicators() {
  const [indicators, setIndicators] = useState<MacroData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        console.log("Fetching macro data from http://localhost:8001/api/macro/overview");
        const response = await fetch("http://localhost:8001/api/macro/overview");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Macro data received:", data);
        setIndicators(data.indicators || {});
      } catch (error) {
        console.error("Failed to fetch macro data:", error);
        setIndicators({});
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매크로 지표</CardTitle>
          <CardDescription>로딩 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                  <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const macroItems = [
    indicators.fear_greed,
    indicators.m2,
    indicators.fed_funds_rate,
    indicators.vix,
  ].filter(Boolean) as Array<MacroIndicator & { label?: string; unit?: string; status?: string }>;

  if (macroItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매크로 지표</CardTitle>
          <CardDescription>데이터를 불러올 수 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>매크로 지표</CardTitle>
        <CardDescription>
          주요 거시경제 지표를 실시간으로 모니터링하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {macroItems.map((item) => {
            const iconInfo = iconMap[item.name] || {
              icon: Activity,
              color: "text-muted-foreground",
              bgColor: "bg-muted",
            };
            const Icon = iconInfo.icon;
            const displayLabel = item.label || item.status || item.unit || "";

            return (
              <div key={item.name} className="flex items-center space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconInfo.bgColor}`}>
                  <Icon className={`h-6 w-6 ${iconInfo.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.name}
                  </p>
                  <div className="flex items-baseline space-x-1">
                    <p className="text-2xl font-bold">
                      {formatNumber(item.value)}
                    </p>
                    {displayLabel && (
                      <p className="text-sm text-muted-foreground">
                        {displayLabel}
                      </p>
                    )}
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


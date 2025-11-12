"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, TrendingUp, Globe } from "lucide-react";
import { formatNumber } from "@/lib/utils";

// 임시 데이터
const macroData = [
  {
    name: "CNN Fear & Greed",
    value: 65,
    label: "Greed",
    icon: Activity,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    name: "M2 통화량",
    value: 21.2,
    label: "조 달러",
    icon: DollarSign,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "연준 기준금리",
    value: 5.5,
    label: "%",
    icon: TrendingUp,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    name: "VIX 지수",
    value: 13.8,
    label: "Low",
    icon: Globe,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export function MacroIndicators() {
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
          {macroData.map((item) => {
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


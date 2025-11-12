"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";

// 임시 데이터 (추후 API 연동)
const marketData = [
  {
    name: "S&P 500",
    symbol: "SPX",
    price: 4783.45,
    change: 1.24,
    changePercent: 0.026,
  },
  {
    name: "NASDAQ",
    symbol: "IXIC",
    price: 15095.14,
    change: 45.32,
    changePercent: 0.301,
  },
  {
    name: "KOSPI",
    symbol: "KS11",
    price: 2594.35,
    change: -8.45,
    changePercent: -0.325,
  },
  {
    name: "USD/KRW",
    symbol: "USDKRW",
    price: 1308.50,
    change: 2.30,
    changePercent: 0.176,
  },
];

export function MarketOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {marketData.map((item) => {
        const isPositive = item.change > 0;
        const isNegative = item.change < 0;
        
        return (
          <Card key={item.symbol}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.name}
              </CardTitle>
              {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-danger" />}
              {!isPositive && !isNegative && <Minus className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(item.price)}
              </div>
              <p className={`text-xs ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-muted-foreground'}`}>
                {formatPercent(item.changePercent)} ({isPositive ? '+' : ''}{formatNumber(item.change)})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.symbol}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


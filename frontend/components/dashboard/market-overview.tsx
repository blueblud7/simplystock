"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/market/overview");
        const data = await response.json();
        setMarketData(data.indices || []);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        setMarketData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
                {formatPercent(item.change_percent)} ({isPositive ? '+' : ''}{formatNumber(item.change)})
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

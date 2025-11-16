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
  timestamp: string;
}

export function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        console.log("Fetching market data from http://localhost:8001/api/market/overview");
        const response = await fetch("http://localhost:8001/api/market/overview");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Market data received:", data);
        setIndices(data.indices || []);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        // 에러 시 빈 배열 유지
        setIndices([]);
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
              <CardTitle className="text-sm font-medium">로딩 중...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (indices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        시장 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {indices.map((item) => {
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
                {formatPercent(item.change_percent / 100)} ({isPositive ? '+' : ''}{formatNumber(item.change)})
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


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  days_at_high?: number;
  days_at_low?: number;
}

export function Week52Highlights() {
  const [highStocks, setHighStocks] = useState<Stock[]>([]);
  const [lowStocks, setLowStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [highsRes, lowsRes] = await Promise.all([
          fetch("http://localhost:8001/api/52week/highs?limit=5"),
          fetch("http://localhost:8001/api/52week/lows?limit=5")
        ]);

        const highsData = await highsRes.json();
        const lowsData = await lowsRes.json();

        setHighStocks(highsData.stocks || []);
        setLowStocks(lowsData.stocks || []);
      } catch (error) {
        console.error("Failed to fetch 52-week data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>52주 신고가/신저가</CardTitle>
          <CardDescription>
            최근 52주 신고가 또는 신저가를 기록한 주요 종목
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>52주 신고가/신저가</CardTitle>
        <CardDescription>
          최근 52주 신고가 또는 신저가를 기록한 주요 종목 (실시간)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="high" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="high">
              <TrendingUp className="mr-2 h-4 w-4" />
              신고가 ({highStocks.length})
            </TabsTrigger>
            <TabsTrigger value="low">
              <TrendingDown className="mr-2 h-4 w-4" />
              신저가 ({lowStocks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="high" className="space-y-4">
            <div className="space-y-2">
              {highStocks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">데이터가 없습니다</p>
              ) : (
                highStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{stock.symbol}</p>
                        {stock.days_at_high && (
                          <span className="text-xs text-muted-foreground">
                            {stock.days_at_high === 1 ? '오늘' : `${stock.days_at_high}일째`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatNumber(stock.price)}</p>
                      <p className="text-sm text-success">
                        {formatPercent(stock.change_percent)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="low" className="space-y-4">
            <div className="space-y-2">
              {lowStocks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">데이터가 없습니다</p>
              ) : (
                lowStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{stock.symbol}</p>
                        {stock.days_at_low && (
                          <span className="text-xs text-muted-foreground">
                            {stock.days_at_low === 1 ? '오늘' : `${stock.days_at_low}일째`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatNumber(stock.price)}</p>
                      <p className="text-sm text-danger">
                        {formatPercent(stock.change_percent)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


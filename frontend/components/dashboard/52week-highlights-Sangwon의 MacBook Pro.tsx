"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Stock52Week {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  days_at_high?: number;
  days_at_low?: number;
}

export function Week52Highlights() {
  const [highStocks, setHighStocks] = useState<Stock52Week[]>([]);
  const [lowStocks, setLowStocks] = useState<Stock52Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch52WeekData = async () => {
      try {
        console.log("Fetching 52 week data...");
        
        // 신고가
        const highsResponse = await fetch("http://localhost:8001/api/52week/highs?limit=5");
        if (highsResponse.ok) {
          const highsData = await highsResponse.json();
          setHighStocks(highsData.stocks || []);
        }
        
        // 신저가
        const lowsResponse = await fetch("http://localhost:8001/api/52week/lows?limit=5");
        if (lowsResponse.ok) {
          const lowsData = await lowsResponse.json();
          setLowStocks(lowsData.stocks || []);
        }
      } catch (error) {
        console.error("Failed to fetch 52 week data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetch52WeekData();
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>52주 신고가/신저가</CardTitle>
        <CardDescription>
          최근 52주 신고가 또는 신저가를 기록한 주요 종목
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="high" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="high">
              <TrendingUp className="mr-2 h-4 w-4" />
              신고가
            </TabsTrigger>
            <TabsTrigger value="low">
              <TrendingDown className="mr-2 h-4 w-4" />
              신저가
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="high" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : highStocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">52주 신고가 종목이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {highStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{stock.symbol}</p>
                        <span className="text-xs text-muted-foreground">
                          {stock.days_at_high === 1 ? '오늘' : `${stock.days_at_high}일째`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatNumber(stock.price)}</p>
                      <p className="text-sm text-success">
                        {formatPercent(stock.change_percent / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="low" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : lowStocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">52주 신저가 종목이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {lowStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{stock.symbol}</p>
                        <span className="text-xs text-muted-foreground">
                          {stock.days_at_low === 1 ? '오늘' : `${stock.days_at_low}일째`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatNumber(stock.price)}</p>
                      <p className="text-sm text-danger">
                        {formatPercent(stock.change_percent / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


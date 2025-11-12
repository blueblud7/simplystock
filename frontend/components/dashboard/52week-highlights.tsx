"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";

// 임시 데이터
const highStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 195.71, change: 2.45, changePercent: 1.27, daysAtHigh: 1 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91, change: 5.23, changePercent: 1.40, daysAtHigh: 1 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.22, change: 8.45, changePercent: 1.74, daysAtHigh: 2 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change: 1.92, changePercent: 1.37, daysAtHigh: 1 },
  { symbol: "META", name: "Meta Platforms", price: 338.54, change: 4.21, changePercent: 1.26, daysAtHigh: 3 },
];

const lowStocks = [
  { symbol: "TSLA", name: "Tesla Inc.", price: 238.72, change: -12.45, changePercent: -4.96, daysAtLow: 1 },
  { symbol: "DIS", name: "Walt Disney Co.", price: 82.15, change: -3.21, changePercent: -3.76, daysAtLow: 2 },
  { symbol: "INTC", name: "Intel Corp.", price: 43.89, change: -2.11, changePercent: -4.59, daysAtLow: 1 },
  { symbol: "PYPL", name: "PayPal Holdings", price: 58.32, change: -1.87, changePercent: -3.11, daysAtLow: 4 },
  { symbol: "BA", name: "Boeing Co.", price: 178.43, change: -5.67, changePercent: -3.08, daysAtLow: 1 },
];

export function Week52Highlights() {
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
                        {stock.daysAtHigh === 1 ? '오늘' : `${stock.daysAtHigh}일째`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${formatNumber(stock.price)}</p>
                    <p className="text-sm text-success">
                      {formatPercent(stock.changePercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="low" className="space-y-4">
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
                        {stock.daysAtLow === 1 ? '오늘' : `${stock.daysAtLow}일째`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${formatNumber(stock.price)}</p>
                    <p className="text-sm text-danger">
                      {formatPercent(stock.changePercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


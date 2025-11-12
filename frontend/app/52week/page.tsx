"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Week52Chart } from "@/components/charts/52week-chart";
import { Week52Table } from "@/components/52week/52week-table";

// 임시 52주 신고가 데이터
const highStocks = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    price: 195.71, 
    high52week: 195.71,
    change: 2.45, 
    changePercent: 1.27, 
    daysAtHigh: 1,
    sector: "기술",
    marketCap: 3.05,
    volume: 58.2
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corp.", 
    price: 378.91,
    high52week: 378.91,
    change: 5.23, 
    changePercent: 1.40, 
    daysAtHigh: 1,
    sector: "기술",
    marketCap: 2.81,
    volume: 24.5
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corp.", 
    price: 495.22,
    high52week: 495.22,
    change: 8.45, 
    changePercent: 1.74, 
    daysAtHigh: 2,
    sector: "기술",
    marketCap: 1.22,
    volume: 42.1
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    price: 141.80,
    high52week: 141.80,
    change: 1.92, 
    changePercent: 1.37, 
    daysAtHigh: 1,
    sector: "통신",
    marketCap: 1.78,
    volume: 28.3
  },
  { 
    symbol: "META", 
    name: "Meta Platforms", 
    price: 338.54,
    high52week: 338.54,
    change: 4.21, 
    changePercent: 1.26, 
    daysAtHigh: 3,
    sector: "통신",
    marketCap: 0.89,
    volume: 19.7
  },
];

// 임시 52주 신저가 데이터
const lowStocks = [
  { 
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    price: 238.72,
    low52week: 238.72,
    change: -12.45, 
    changePercent: -4.96, 
    daysAtLow: 1,
    sector: "소비재",
    marketCap: 0.76,
    volume: 128.5
  },
  { 
    symbol: "DIS", 
    name: "Walt Disney Co.", 
    price: 82.15,
    low52week: 82.15,
    change: -3.21, 
    changePercent: -3.76, 
    daysAtLow: 2,
    sector: "통신",
    marketCap: 0.15,
    volume: 8.9
  },
  { 
    symbol: "INTC", 
    name: "Intel Corp.", 
    price: 43.89,
    low52week: 43.89,
    change: -2.11, 
    changePercent: -4.59, 
    daysAtLow: 1,
    sector: "기술",
    marketCap: 0.18,
    volume: 42.3
  },
  { 
    symbol: "PYPL", 
    name: "PayPal Holdings", 
    price: 58.32,
    low52week: 58.32,
    change: -1.87, 
    changePercent: -3.11, 
    daysAtLow: 4,
    sector: "금융",
    marketCap: 0.06,
    volume: 12.4
  },
  { 
    symbol: "BA", 
    name: "Boeing Co.", 
    price: 178.43,
    low52week: 178.43,
    change: -5.67, 
    changePercent: -3.08, 
    daysAtLow: 1,
    sector: "산업재",
    marketCap: 0.11,
    volume: 6.7
  },
];

export default function Week52Page() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">52주 신고가/신저가</h1>
        <p className="text-muted-foreground">
          브레이크아웃과 브레이크다운 종목을 추적합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">오늘의 신고가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">127</div>
            <p className="text-xs text-muted-foreground mt-1">
              전일 대비 +15
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">오늘의 신저가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-danger">42</div>
            <p className="text-xs text-muted-foreground mt-1">
              전일 대비 -8
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">신고가/신저가 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.02</div>
            <p className="text-xs text-muted-foreground mt-1">
              강세 시장 신호
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 52주 신고가/신저가 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>52주 신고가/신저가 종목</CardTitle>
          <CardDescription>
            최근 52주 신고가 또는 신저가를 기록한 종목 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="high" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="high">신고가 ({highStocks.length})</TabsTrigger>
              <TabsTrigger value="low">신저가 ({lowStocks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="high">
              <Week52Table stocks={highStocks} type="high" />
            </TabsContent>
            
            <TabsContent value="low">
              <Week52Table stocks={lowStocks} type="low" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 히스토리 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>52주 신고가/신저가 추이</CardTitle>
          <CardDescription>
            일별 신고가/신저가 달성 종목 수
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Week52Chart />
        </CardContent>
      </Card>

      {/* 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle>시장 브레드스(Market Breadth) 분석</CardTitle>
          <CardDescription>
            52주 신고가/신저가 비율로 본 시장 강도
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 p-4 border border-success/20">
              <h4 className="font-semibold text-success mb-2">✓ 강세 시그널</h4>
              <p className="text-sm text-muted-foreground">
                신고가/신저가 비율이 3.0 이상으로, 광범위한 상승세를 나타냅니다. 
                대형주를 중심으로 강한 모멘텀이 지속되고 있습니다.
              </p>
            </div>
            
            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
              <h4 className="font-semibold text-blue-500 mb-2">📊 섹터별 분포</h4>
              <p className="text-sm text-muted-foreground mb-3">
                신고가 종목의 섹터별 분포:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>기술</span>
                  <span className="font-semibold">42%</span>
                </div>
                <div className="flex justify-between">
                  <span>금융</span>
                  <span className="font-semibold">18%</span>
                </div>
                <div className="flex justify-between">
                  <span>헬스케어</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex justify-between">
                  <span>기타</span>
                  <span className="font-semibold">25%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


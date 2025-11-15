"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Week52Chart } from "@/components/charts/52week-chart";
import { Week52Table } from "@/components/52week/52week-table";
import { useEffect, useState } from "react";

interface Stock52Week {
  symbol: string;
  name: string;
  price: number;
  high52week?: number;
  low52week?: number;
  change: number;
  changePercent: number;
  daysAtHigh?: number;
  daysAtLow?: number;
  sector: string;
  marketCap: number;
  volume: number;
}

interface Stats {
  highs_count: number;
  lows_count: number;
  ratio: number;
  market_breadth: string;
}

export default function Week52Page() {
  const [highStocks, setHighStocks] = useState<Stock52Week[]>([]);
  const [lowStocks, setLowStocks] = useState<Stock52Week[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [highsRes, lowsRes, statsRes] = await Promise.all([
          fetch("http://localhost:8001/api/52week/highs?limit=20"),
          fetch("http://localhost:8001/api/52week/lows?limit=20"),
          fetch("http://localhost:8001/api/52week/stats")
        ]);

        const highsData = await highsRes.json();
        const lowsData = await lowsRes.json();
        const statsData = await statsRes.json();

        setHighStocks(highsData.stocks || []);
        setLowStocks(lowsData.stocks || []);
        setStats(statsData);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">52주 신고가/신저가</h1>
          <p className="text-muted-foreground">
            브레이크아웃과 브레이크다운 종목을 추적합니다
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">52주 데이터 로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
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
            <div className="text-3xl font-bold text-success">{stats?.highs_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              52주 신고가 근접 종목
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">오늘의 신저가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-danger">{stats?.lows_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              52주 신저가 근접 종목
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">신고가/신저가 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.ratio || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.market_breadth === "strong" ? "강세 시장" :
               stats?.market_breadth === "positive" ? "긍정적 시장" :
               stats?.market_breadth === "neutral" ? "중립 시장" : "약세 시장"}
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
            52주 신고가/신저가 비율로 본 시장 강도 (실시간 데이터)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats && (
              <>
                {stats.market_breadth === "strong" && (
                  <div className="rounded-lg bg-success/10 p-4 border border-success/20">
                    <h4 className="font-semibold text-success mb-2">✓ 강세 시그널</h4>
                    <p className="text-sm text-muted-foreground">
                      신고가/신저가 비율이 {stats.ratio}로, 광범위한 상승세를 나타냅니다. 
                      대형주를 중심으로 강한 모멘텀이 지속되고 있습니다.
                    </p>
                  </div>
                )}
                
                {stats.market_breadth === "positive" && (
                  <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                    <h4 className="font-semibold text-blue-500 mb-2">📈 긍정적 시그널</h4>
                    <p className="text-sm text-muted-foreground">
                      신고가/신저가 비율이 {stats.ratio}로, 시장이 긍정적인 흐름을 보이고 있습니다.
                    </p>
                  </div>
                )}
                
                {stats.market_breadth === "neutral" && (
                  <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/20">
                    <h4 className="font-semibold text-orange-500 mb-2">⚖️ 중립 시그널</h4>
                    <p className="text-sm text-muted-foreground">
                      신고가/신저가 비율이 {stats.ratio}로, 시장이 균형을 유지하고 있습니다.
                    </p>
                  </div>
                )}
                
                {stats.market_breadth === "weak" && (
                  <div className="rounded-lg bg-danger/10 p-4 border border-danger/20">
                    <h4 className="font-semibold text-danger mb-2">⚠️ 약세 시그널</h4>
                    <p className="text-sm text-muted-foreground">
                      신고가/신저가 비율이 {stats.ratio}로, 시장이 약세를 보이고 있습니다.
                    </p>
                  </div>
                )}
                
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold mb-2">📊 실시간 통계</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-success font-semibold">신고가 종목: </span>
                      <span>{stats.highs_count}개</span>
                    </div>
                    <div>
                      <span className="text-danger font-semibold">신저가 종목: </span>
                      <span>{stats.lows_count}개</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


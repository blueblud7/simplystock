"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Week52Chart } from "@/components/charts/52week-chart";
import { Week52Table } from "@/components/52week/52week-table";

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

export default function Week52Page() {
  const [highStocks, setHighStocks] = useState<Stock52Week[]>([]);
  const [lowStocks, setLowStocks] = useState<Stock52Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch52WeekData = async () => {
      try {
        console.log("Fetching 52 week data...");

        // 52주 신고가 데이터
        const highsResponse = await fetch("http://localhost:8001/api/52week/highs?limit=20");
        if (highsResponse.ok) {
          const highsData = await highsResponse.json();
          setHighStocks(highsData.stocks || []);
        }

        // 52주 신저가 데이터
        const lowsResponse = await fetch("http://localhost:8001/api/52week/lows?limit=20");
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">52주 신고가/신저가</h1>
        <p className="text-muted-foreground">
          브레이크아웃과 브레이크다운 종목을 추적합니다
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          로딩 중...
        </div>
      )}

      {/* 통계 카드 */}
      {!loading && (highStocks.length > 0 || lowStocks.length > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">오늘의 신고가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{highStocks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                종목 수
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">오늘의 신저가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-danger">{lowStocks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                종목 수
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">신고가/신저가 비율</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {lowStocks.length > 0 ? (highStocks.length / lowStocks.length).toFixed(2) : highStocks.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStocks.length > 0 && highStocks.length / lowStocks.length > 2 ? "강세 시장 신호" : "중립"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 52주 신고가/신저가 테이블 */}
      {!loading && (highStocks.length > 0 || lowStocks.length > 0) && (
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
                {highStocks.length > 0 ? (
                  <Week52Table stocks={highStocks} type="high" />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    신고가 종목이 없습니다.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="low">
                {lowStocks.length > 0 ? (
                  <Week52Table stocks={lowStocks} type="low" />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    신저가 종목이 없습니다.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 데이터 없음 */}
      {!loading && highStocks.length === 0 && lowStocks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          데이터를 불러올 수 없습니다.
        </div>
      )}

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


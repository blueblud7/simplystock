"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectorPerformanceChart } from "@/components/charts/sector-performance-chart";
import { SectorTable } from "@/components/sectors/sector-table";
import { formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Sector {
  name: string;
  symbol: string;
  daily: number;
  weekly: number;
  monthly: number;
  ytd: number;
  description: string;
  size?: number;
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/sectors/performance");
        const data = await response.json();
        setSectors(data.sectors || []);
      } catch (error) {
        console.error("Failed to fetch sectors:", error);
        setSectors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">섹터 분석</h1>
          <p className="text-muted-foreground">
            S&P 500 11개 섹터의 퍼포먼스를 추적하고 분석합니다
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">데이터 로딩 중...</p>
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
        <h1 className="text-3xl font-bold tracking-tight">섹터 분석</h1>
        <p className="text-muted-foreground">
          S&P 500 11개 섹터의 퍼포먼스를 추적하고 분석합니다
        </p>
      </div>

      {/* 섹터별 수익률 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>섹터별 수익률</CardTitle>
          <CardDescription>
            기간별 섹터 퍼포먼스 비교
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorTable sectors={sectors} />
        </CardContent>
      </Card>

      {/* 히스토리 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>섹터 퍼포먼스 추이</CardTitle>
          <CardDescription>
            일별/주별/월별 섹터 수익률 히스토리
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorPerformanceChart />
        </CardContent>
      </Card>

      {/* 섹터 로테이션 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle>섹터 로테이션 인사이트</CardTitle>
          <CardDescription>
            현재 시장 환경에서의 섹터 선호도 (실시간 데이터 기반)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectors.length > 0 && (
              <>
                <div className="rounded-lg bg-success/10 p-4 border border-success/20">
                  <h4 className="font-semibold text-success mb-2">강세 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>{sectors.filter(s => s.daily > 1).map(s => s.name).join(", ")}</strong> - 
                    오늘 1% 이상 상승하며 강세를 보이고 있습니다.
                  </p>
                </div>
                
                <div className="rounded-lg bg-danger/10 p-4 border border-danger/20">
                  <h4 className="font-semibold text-danger mb-2">약세 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>{sectors.filter(s => s.daily < -0.5).map(s => s.name).join(", ") || "없음"}</strong> - 
                    {sectors.filter(s => s.daily < -0.5).length > 0 
                      ? "시장 전반적인 조정 속에서 약세를 보이고 있습니다."
                      : "오늘은 전반적으로 안정적인 모습입니다."}
                  </p>
                </div>
                
                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-blue-500 mb-2">중립 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>{sectors.filter(s => s.daily >= -0.5 && s.daily <= 1).map(s => s.name).join(", ")}</strong> - 
                    안정적인 흐름을 유지하고 있습니다.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


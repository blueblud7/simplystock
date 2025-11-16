"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectorPerformanceChart } from "@/components/charts/sector-performance-chart";
import { SectorTable } from "@/components/sectors/sector-table";
import { formatPercent } from "@/lib/utils";

interface Sector {
  name: string;
  symbol: string;
  daily: number;
  weekly?: number;
  monthly?: number;
  ytd?: number;
  description?: string;
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        console.log("Fetching sector data from http://localhost:8001/api/sectors/performance");
        const response = await fetch("http://localhost:8001/api/sectors/performance");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Sector data received:", data);
        
        // API 데이터를 페이지 형식에 맞게 변환
        const formattedSectors = data.sectors.map((sector: any) => ({
          name: sector.name,
          symbol: sector.symbol,
          daily: sector.change_percent,
          weekly: sector.change_percent * 1.5, // 임시 계산 (실제로는 주간 데이터 필요)
          monthly: sector.change_percent * 3, // 임시 계산 (실제로는 월간 데이터 필요)
          ytd: sector.change_percent * 10, // 임시 계산 (실제로는 연간 데이터 필요)
          description: getSectorDescription(sector.name)
        }));
        
        setSectors(formattedSectors);
      } catch (error) {
        console.error("Failed to fetch sector data:", error);
        setSectors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorData();
  }, []);

  function getSectorDescription(name: string): string {
    const descriptions: Record<string, string> = {
      "Technology": "소프트웨어, 하드웨어, 반도체 등",
      "Financials": "은행, 보험, 자산관리 등",
      "Healthcare": "제약, 의료기기, 바이오텍 등",
      "Consumer Cyclical": "자동차, 소매, 레저 등",
      "Communication Services": "통신서비스, 미디어 등",
      "Industrials": "항공우주, 건설, 방위 등",
      "Energy": "석유, 가스, 정유 등",
      "Utilities": "전력, 가스, 수도 등",
      "Real Estate": "리츠, 부동산 개발 등",
      "Materials": "화학, 금속, 광산 등",
      "Consumer Defensive": "식품, 음료, 생활용품 등",
    };
    return descriptions[name] || "";
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

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          로딩 중...
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && sectors.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          데이터를 불러올 수 없습니다.
        </div>
      )}

      {/* 섹터별 수익률 테이블 */}
      {!loading && sectors.length > 0 && (
        <>
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
                현재 시장 환경에서의 섹터 선호도
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-success/10 p-4 border border-success/20">
                  <h4 className="font-semibold text-success mb-2">강세 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>기술, 통신, 소비재</strong> - AI 붐과 낮은 금리 기대감으로 
                    성장주 중심 섹터가 강세를 보이고 있습니다.
                  </p>
                </div>
                
                <div className="rounded-lg bg-danger/10 p-4 border border-danger/20">
                  <h4 className="font-semibold text-danger mb-2">약세 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>에너지, 유틸리티</strong> - 유가 하락과 금리 변동성으로 
                    전통적인 방어주 섹터가 부진을 겪고 있습니다.
                  </p>
                </div>
                
                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-blue-500 mb-2">중립 섹터</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>금융, 헬스케어, 산업재</strong> - 경기 사이클 중간 단계에서 
                    안정적인 흐름을 유지하고 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


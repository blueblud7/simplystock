"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectorPerformanceChart } from "@/components/charts/sector-performance-chart";
import { SectorTable } from "@/components/sectors/sector-table";
import { formatPercent } from "@/lib/utils";

// 임시 섹터 데이터
const sectors = [
  { 
    name: "기술", 
    symbol: "XLK", 
    daily: 1.45, 
    weekly: 3.2, 
    monthly: 8.5,
    ytd: 42.3,
    description: "소프트웨어, 하드웨어, 반도체 등"
  },
  { 
    name: "금융", 
    symbol: "XLF", 
    daily: 0.82, 
    weekly: 2.1, 
    monthly: 5.3,
    ytd: 28.7,
    description: "은행, 보험, 자산관리 등"
  },
  { 
    name: "헬스케어", 
    symbol: "XLV", 
    daily: 0.54, 
    weekly: 1.8, 
    monthly: 4.2,
    ytd: 18.5,
    description: "제약, 의료기기, 바이오텍 등"
  },
  { 
    name: "소비재", 
    symbol: "XLY", 
    daily: -0.32, 
    weekly: -0.8, 
    monthly: 2.1,
    ytd: 32.1,
    description: "자동차, 소매, 레저 등"
  },
  { 
    name: "통신", 
    symbol: "XLC", 
    daily: 1.12, 
    weekly: 2.8, 
    monthly: 6.7,
    ytd: 35.4,
    description: "통신서비스, 미디어 등"
  },
  { 
    name: "산업재", 
    symbol: "XLI", 
    daily: 0.23, 
    weekly: 1.2, 
    monthly: 3.8,
    ytd: 22.6,
    description: "항공우주, 건설, 방위 등"
  },
  { 
    name: "에너지", 
    symbol: "XLE", 
    daily: -1.25, 
    weekly: -2.3, 
    monthly: -0.5,
    ytd: 5.2,
    description: "석유, 가스, 정유 등"
  },
  { 
    name: "유틸리티", 
    symbol: "XLU", 
    daily: -0.45, 
    weekly: 0.2, 
    monthly: 1.8,
    ytd: 8.3,
    description: "전력, 가스, 수도 등"
  },
  { 
    name: "부동산", 
    symbol: "XLRE", 
    daily: 0.15, 
    weekly: 0.9, 
    monthly: 3.2,
    ytd: 12.4,
    description: "리츠, 부동산 개발 등"
  },
  { 
    name: "소재", 
    symbol: "XLB", 
    daily: 0.67, 
    weekly: 1.5, 
    monthly: 4.1,
    ytd: 15.8,
    description: "화학, 금속, 광산 등"
  },
  { 
    name: "필수소비재", 
    symbol: "XLP", 
    daily: -0.21, 
    weekly: 0.5, 
    monthly: 2.3,
    ytd: 11.2,
    description: "식품, 음료, 생활용품 등"
  },
];

export default function SectorsPage() {
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
    </div>
  );
}


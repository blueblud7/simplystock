"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MacroChart } from "@/components/charts/macro-chart";
import { Activity, DollarSign, TrendingUp, Globe, Zap, ArrowUpDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MacroData {
  indicators: {
    fear_greed: {
      name: string;
      value: number;
      label: string;
      timestamp: string;
    };
    m2: {
      name: string;
      value: number;
      change: number;
      unit: string;
      timestamp: string;
    };
    fed_funds_rate: {
      name: string;
      value: number;
      change: number;
      unit: string;
      timestamp: string;
    };
    vix: {
      name: string;
      value: number;
      change: number;
      status: string;
      timestamp: string;
    };
  };
  last_update?: string;
  next_update?: string;
}

export default function MacroPage() {
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [interestRates, setInterestRates] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        const [macroRes, ratesRes, exchangeRes] = await Promise.all([
          fetch("http://localhost:8001/api/macro/overview"),
          fetch("http://localhost:8001/api/macro/interest-rates"),
          fetch("http://localhost:8001/api/macro/exchange-rates"),
        ]);
        const macroJson = await macroRes.json();
        const ratesJson = await ratesRes.json();
        const exchangeJson = await exchangeRes.json();

        setMacroData(macroJson);
        setInterestRates(ratesJson);
        setExchangeRates(exchangeJson);
      } catch (error) {
        console.error("Failed to fetch macro data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매크로 지표</h1>
          <p className="text-muted-foreground">
            거시경제 지표를 통해 시장 환경을 분석합니다
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">매크로 데이터 로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!macroData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매크로 지표</h1>
          <p className="text-muted-foreground">
            거시경제 지표를 통해 시장 환경을 분석합니다
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 마지막 업데이트 시간 포맷팅
  const lastUpdate = macroData.last_update 
    ? new Date(macroData.last_update).toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    : null;

  const macroIndicators = [
    {
      id: "fear-greed",
      name: macroData.indicators.fear_greed.name,
      value: macroData.indicators.fear_greed.value,
      label: macroData.indicators.fear_greed.label,
      icon: Activity,
      color: macroData.indicators.fear_greed.value > 60 ? "text-success" : macroData.indicators.fear_greed.value < 40 ? "text-danger" : "text-orange-500",
      bgColor: macroData.indicators.fear_greed.value > 60 ? "bg-success/10" : macroData.indicators.fear_greed.value < 40 ? "bg-danger/10" : "bg-orange-500/10",
      description: "시장 심리 지표",
      interpretation: macroData.indicators.fear_greed.value > 70 
        ? "극도의 탐욕 단계. 시장이 과열되었을 수 있습니다."
        : macroData.indicators.fear_greed.value > 60
        ? "탐욕 단계. 시장이 과열될 수 있으니 주의가 필요합니다."
        : macroData.indicators.fear_greed.value > 40
        ? "중립 단계. 시장이 균형을 유지하고 있습니다."
        : macroData.indicators.fear_greed.value > 30
        ? "공포 단계. 투자자들이 조심스러운 모습입니다."
        : "극도의 공포 단계. 매수 기회일 수 있습니다.",
      range: { min: 0, max: 100 },
      status: "positive"
    },
    {
      id: "m2",
      name: macroData.indicators.m2.name,
      value: macroData.indicators.m2.value,
      label: macroData.indicators.m2.unit,
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "유동성 지표",
      interpretation: `M2 통화량이 ${macroData.indicators.m2.value} 조 달러입니다. ${
        macroData.indicators.m2.change > 0 
        ? "통화량이 증가하여 유동성이 개선되고 있습니다."
        : macroData.indicators.m2.change < 0
        ? "통화량이 감소하여 긴축 상태입니다."
        : "통화량이 안정적으로 유지되고 있습니다."
      }`,
      change: macroData.indicators.m2.change,
      status: "neutral"
    },
    {
      id: "fed-rate",
      name: macroData.indicators.fed_funds_rate.name,
      value: macroData.indicators.fed_funds_rate.value,
      label: macroData.indicators.fed_funds_rate.unit,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "금리 정책",
      interpretation: `현재 ${macroData.indicators.fed_funds_rate.value}%의 ${
        macroData.indicators.fed_funds_rate.value > 5 ? "높은" : macroData.indicators.fed_funds_rate.value > 3 ? "중간" : "낮은"
      } 금리입니다. ${
        macroData.indicators.fed_funds_rate.change > 0
        ? "금리 인상으로 긴축 기조가 유지되고 있습니다."
        : macroData.indicators.fed_funds_rate.change < 0
        ? "금리 인하로 완화 기조로 전환되었습니다."
        : "금리가 동결되어 관망 자세를 취하고 있습니다."
      }`,
      change: macroData.indicators.fed_funds_rate.change,
      status: "neutral"
    },
    {
      id: "vix",
      name: macroData.indicators.vix.name,
      value: macroData.indicators.vix.value,
      label: macroData.indicators.vix.status,
      icon: Zap,
      color: macroData.indicators.vix.value < 15 ? "text-success" : macroData.indicators.vix.value < 25 ? "text-orange-500" : "text-danger",
      bgColor: macroData.indicators.vix.value < 15 ? "bg-success/10" : macroData.indicators.vix.value < 25 ? "bg-orange-500/10" : "bg-danger/10",
      description: "변동성 지표",
      interpretation: `VIX ${macroData.indicators.vix.value}로 ${macroData.indicators.vix.status} 변동성입니다. ${
        macroData.indicators.vix.value < 15
        ? "시장이 매우 안정적입니다."
        : macroData.indicators.vix.value < 25
        ? "보통 수준의 변동성입니다."
        : "높은 변동성으로 시장이 불안정합니다."
      }`,
      change: macroData.indicators.vix.change,
      status: "positive"
    },
  ];
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">매크로 지표</h1>
            <p className="text-muted-foreground">
              거시경제 지표를 통해 시장 환경을 분석합니다
            </p>
          </div>
          {lastUpdate && (
            <div className="text-sm text-muted-foreground text-right">
              <p>마지막 업데이트</p>
              <p className="font-semibold">{lastUpdate}</p>
              <p className="text-xs mt-1">매일 06:30 PST 자동 갱신</p>
            </div>
          )}
        </div>

      {/* 주요 지표 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {macroIndicators.map((indicator) => {
          const Icon = indicator.icon;
          
          return (
            <Card key={indicator.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {indicator.name}
                </CardTitle>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${indicator.bgColor}`}>
                  <Icon className={`h-5 w-5 ${indicator.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold">
                      {formatNumber(indicator.value)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {indicator.label}
                    </div>
                  </div>
                  
                  {indicator.change !== undefined && (
                    <div className={`text-sm ${indicator.change > 0 ? 'text-success' : indicator.change < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                      {indicator.change > 0 ? '+' : ''}{formatNumber(indicator.change)}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {indicator.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fear & Greed Index 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>CNN Fear & Greed Index</CardTitle>
          <CardDescription>
            시장 심리를 0(극도의 공포) ~ 100(극도의 탐욕) 척도로 표시
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 게이지 바 */}
            <div className="relative h-8 bg-gradient-to-r from-danger via-yellow-500 to-success rounded-full overflow-hidden">
              <div 
                className="absolute top-0 h-full w-1 bg-white shadow-lg"
                style={{ left: `${macroData.indicators.fear_greed.value}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold whitespace-nowrap">
                  {macroData.indicators.fear_greed.value}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Extreme Fear</span>
              <span>Fear</span>
              <span>Neutral</span>
              <span>Greed</span>
              <span>Extreme Greed</span>
            </div>
            
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>해석:</strong> {macroIndicators[0].interpretation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 데이터 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 데이터 요약</CardTitle>
          <CardDescription>
            FRED API 및 Yahoo Finance 실시간 데이터
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm leading-relaxed">
                현재 연준 기준금리는 <strong>{macroData.indicators.fed_funds_rate.value}%</strong>이며,
                M2 통화량은 <strong>{macroData.indicators.m2.value} 조 달러</strong>입니다.
                VIX 지수는 <strong>{macroData.indicators.vix.value}</strong>로 
                <strong className={`ml-1 ${
                  macroData.indicators.vix.value < 15 ? "text-success" : 
                  macroData.indicators.vix.value < 25 ? "text-orange-500" : 
                  "text-danger"
                }`}>
                  {macroData.indicators.vix.status}
                </strong> 변동성을 나타내고 있습니다.
              </p>
            </div>
            
            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
              <h4 className="font-semibold text-blue-500 mb-2">💡 인사이트</h4>
              <p className="text-sm text-muted-foreground">
                {macroData.indicators.fear_greed.value > 60
                  ? "시장 심리가 탐욕 단계에 있습니다. 과열 가능성을 주의해야 합니다."
                  : macroData.indicators.fear_greed.value < 40
                  ? "시장 심리가 공포 단계에 있습니다. 매수 기회를 모색할 수 있습니다."
                  : "시장 심리가 중립적입니다. 균형잡힌 투자 전략이 필요합니다."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 히스토리 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>매크로 지표 추이</CardTitle>
          <CardDescription>
            시간에 따른 주요 지표 변화
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MacroChart />
        </CardContent>
      </Card>

      {/* 상관관계 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>시장 상관관계 인사이트</CardTitle>
          <CardDescription>
            매크로 지표와 주식 시장의 관계
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">📈 금리 ↑ → 그로스주 ↓</h4>
              <p className="text-sm text-muted-foreground">
                높은 금리는 미래 현금 흐름의 할인율을 높여 성장주(기술주)의 밸류에이션을 압박합니다.
                현재 5.5%의 높은 금리로 인해 기술주가 부담을 받고 있습니다.
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">💵 달러 강세 ↑ → 신흥국 ↓</h4>
              <p className="text-sm text-muted-foreground">
                DXY 104.25로 달러 강세 지속. 신흥국 통화 약세와 자본 유출 압력이 있습니다.
                원달러 환율 상승(1,308원)으로 국내 수입 물가 상승 우려가 있습니다.
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">😱 VIX ↓ → 주식 ↑</h4>
              <p className="text-sm text-muted-foreground">
                VIX 13.8의 낮은 수준은 시장 변동성이 낮고 안정적임을 의미합니다.
                일반적으로 VIX가 낮을 때 주식 시장은 상승 추세를 보입니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


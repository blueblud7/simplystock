"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MacroChart } from "@/components/charts/macro-chart";
import { Activity, DollarSign, TrendingUp, Globe, Zap, ArrowUpDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface MacroIndicator {
  id: string;
  name: string;
  value: number;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  interpretation: string;
  change?: number;
  status: string;
}

export default function MacroPage() {
  const [macroIndicators, setMacroIndicators] = useState<MacroIndicator[]>([]);
  const [treasuryYields, setTreasuryYields] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        console.log("Fetching macro data from http://localhost:8001/api/macro/overview");
        const response = await fetch("http://localhost:8001/api/macro/overview");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Macro data received:", data);

        const indicators: MacroIndicator[] = [];

        // VIX
        if (data.indicators.vix) {
          indicators.push({
            id: "vix",
            name: "VIX 지수",
            value: data.indicators.vix.value,
            label: data.indicators.vix.label,
            icon: Zap,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            description: "변동성 지표",
            interpretation: data.indicators.vix.value < 20 ? "낮은 변동성. 시장이 안정적입니다." : "높은 변동성. 시장이 불안정합니다.",
            status: "positive"
          });
        }

        // Fear & Greed
        if (data.indicators.fear_greed) {
          indicators.push({
            id: "fear-greed",
            name: "CNN Fear & Greed Index",
            value: data.indicators.fear_greed.value,
            label: data.indicators.fear_greed.classification,
            icon: Activity,
            color: "text-success",
            bgColor: "bg-success/10",
            description: "시장 심리 지표",
            interpretation: `${data.indicators.fear_greed.classification} 단계입니다.`,
            status: "positive"
          });
        }

        // Fed Funds Rate
        if (data.indicators.fed_funds_rate) {
          indicators.push({
            id: "fed-rate",
            name: "연준 기준금리",
            value: data.indicators.fed_funds_rate.value,
            label: "%",
            icon: TrendingUp,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            description: "금리 정책",
            interpretation: "연준 기준금리입니다.",
            status: "neutral"
          });
        }

        // M2 Money Supply
        if (data.indicators.m2) {
          indicators.push({
            id: "m2",
            name: "M2 통화량",
            value: data.indicators.m2.value,
            label: "조 달러",
            icon: DollarSign,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            description: "유동성 지표",
            interpretation: "M2 통화량이 안정적으로 유지되고 있습니다.",
            status: "neutral"
          });
        }

        setMacroIndicators(indicators);

        // 금리 정보 가져오기
        const ratesResponse = await fetch("http://localhost:8001/api/macro/interest-rates");
        if (ratesResponse.ok) {
          const ratesData = await ratesResponse.json();
          setTreasuryYields({
            "10년물": ratesData.treasury_10y?.value || 0,
            "2년물": ratesData.treasury_2y?.value || 0,
          });
        }

        // 환율 정보 추가
        const exchangeResponse = await fetch("http://localhost:8001/api/macro/exchange-rates");
        if (exchangeResponse.ok) {
          const exchangeData = await exchangeResponse.json();
          
          if (exchangeData.dxy) {
            indicators.push({
              id: "dxy",
              name: "달러 인덱스 (DXY)",
              value: exchangeData.dxy.value,
              label: "",
              icon: Globe,
              color: "text-green-500",
              bgColor: "bg-green-500/10",
              description: "달러 강도",
              interpretation: "달러 강세 지속. 신흥국 자산에 부정적.",
              change: exchangeData.dxy.change,
              status: "neutral"
            });
          }

          if (exchangeData.usd_krw) {
            indicators.push({
              id: "usdkrw",
              name: "USD/KRW",
              value: exchangeData.usd_krw.value,
              label: "원",
              icon: ArrowUpDown,
              color: "text-indigo-500",
              bgColor: "bg-indigo-500/10",
              description: "원달러 환율",
              interpretation: "원화 약세 지속. 수입 물가 상승 압력.",
              change: exchangeData.usd_krw.change,
              status: "negative"
            });
          }

          setMacroIndicators(indicators);
        }
      } catch (error) {
        console.error("Failed to fetch macro data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, []);
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">매크로 지표</h1>
        <p className="text-muted-foreground">
          거시경제 지표를 통해 시장 환경을 분석합니다
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          로딩 중...
        </div>
      )}

      {/* 주요 지표 그리드 */}
      {!loading && macroIndicators.length > 0 && (
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
      )}

      {/* Fear & Greed Index 상세 */}
      {!loading && macroIndicators.find(ind => ind.id === 'fear-greed') && (
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
                  style={{ left: `${macroIndicators.find(ind => ind.id === 'fear-greed')?.value || 50}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold whitespace-nowrap">
                    {macroIndicators.find(ind => ind.id === 'fear-greed')?.value || 50}
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
                  <strong>해석:</strong> {macroIndicators.find(ind => ind.id === 'fear-greed')?.interpretation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 금리 정보 */}
      {!loading && Object.keys(treasuryYields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>미국 국채 수익률 곡선</CardTitle>
            <CardDescription>
              만기별 국채 수익률 (역전 현상 주의)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(treasuryYields).map(([maturity, yield_value]) => (
                <div key={maturity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium w-20">{maturity}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ width: '300px' }}>
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(yield_value / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold">{yield_value}%</span>
                </div>
              ))}
              
              {treasuryYields["2년물"] && treasuryYields["10년물"] && treasuryYields["2년물"] > treasuryYields["10년물"] && (
                <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/20 mt-4">
                  <p className="text-sm">
                    <strong>⚠️ 주의:</strong> 2년물 금리가 10년물보다 높은 역전 현상 발생. 
                    역사적으로 경기 침체 신호일 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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


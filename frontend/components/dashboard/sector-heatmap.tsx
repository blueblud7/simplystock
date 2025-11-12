"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

// 임시 섹터 데이터
const sectors = [
  { name: "기술", symbol: "XLK", change: 1.45, size: 28 },
  { name: "금융", symbol: "XLF", change: 0.82, size: 13 },
  { name: "헬스케어", symbol: "XLV", change: 0.54, size: 14 },
  { name: "소비재", symbol: "XLY", change: -0.32, size: 12 },
  { name: "통신", symbol: "XLC", change: 1.12, size: 9 },
  { name: "산업재", symbol: "XLI", change: 0.23, size: 10 },
  { name: "에너지", symbol: "XLE", change: -1.25, size: 4 },
  { name: "유틸리티", symbol: "XLU", change: -0.45, size: 3 },
  { name: "부동산", symbol: "XLRE", change: 0.15, size: 3 },
  { name: "소재", symbol: "XLB", change: 0.67, size: 3 },
  { name: "필수소비재", symbol: "XLP", change: -0.21, size: 6 },
];

function getColorFromChange(change: number): string {
  if (change > 1) return "bg-success/90 hover:bg-success text-white";
  if (change > 0.5) return "bg-success/70 hover:bg-success/80 text-white";
  if (change > 0) return "bg-success/40 hover:bg-success/50 text-white";
  if (change > -0.5) return "bg-danger/40 hover:bg-danger/50 text-white";
  if (change > -1) return "bg-danger/70 hover:bg-danger/80 text-white";
  return "bg-danger/90 hover:bg-danger text-white";
}

export function SectorHeatmap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>섹터별 히트맵</CardTitle>
        <CardDescription>
          S&P 500 11개 섹터의 오늘 수익률
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sectors.map((sector) => (
            <div
              key={sector.symbol}
              className={`relative rounded-lg p-4 transition-all cursor-pointer ${getColorFromChange(sector.change)}`}
              style={{
                minHeight: `${80 + sector.size * 3}px`,
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs opacity-80">{sector.symbol}</p>
                  <p className="font-semibold text-sm mt-1">{sector.name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">
                    {formatPercent(sector.change)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


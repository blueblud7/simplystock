"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Sector {
  name: string;
  symbol: string;
  daily: number;
  size?: number;
}

function getColorFromChange(change: number): string {
  if (change > 1) return "bg-success/90 hover:bg-success text-white";
  if (change > 0.5) return "bg-success/70 hover:bg-success/80 text-white";
  if (change > 0) return "bg-success/40 hover:bg-success/50 text-white";
  if (change > -0.5) return "bg-danger/40 hover:bg-danger/50 text-white";
  if (change > -1) return "bg-danger/70 hover:bg-danger/80 text-white";
  return "bg-danger/90 hover:bg-danger text-white";
}

export function SectorHeatmap() {
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
        // 에러 시 기본 데이터
        setSectors([
          { name: "기술", symbol: "XLK", daily: 1.45, size: 28 },
          { name: "금융", symbol: "XLF", daily: 0.82, size: 13 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>섹터별 히트맵</CardTitle>
          <CardDescription>
            S&P 500 11개 섹터의 오늘 수익률
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>섹터별 히트맵</CardTitle>
        <CardDescription>
          S&P 500 11개 섹터의 실시간 수익률 ({sectors.length}개)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sectors.map((sector) => (
            <div
              key={sector.symbol}
              className={`relative rounded-lg p-4 transition-all cursor-pointer ${getColorFromChange(sector.daily)}`}
              style={{
                minHeight: `${80 + (sector.size || 10) * 3}px`,
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs opacity-80">{sector.symbol}</p>
                  <p className="font-semibold text-sm mt-1">{sector.name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">
                    {formatPercent(sector.daily)}
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


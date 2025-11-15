"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, ExternalLink } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ReportRecommendation {
  stock_code: string;
  stock_name: string;
  current_price: number;
  target_price: number;
  upside_percent: number;
  recommendation: string;
  report_title: string;
}

export function ReportHighlights() {
  const [recommendations, setRecommendations] = useState<ReportRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/reports/top-recommendations?limit=3");
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Failed to fetch report recommendations:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            증권사 추천 종목
          </CardTitle>
          <CardDescription>애널리스트 TOP 3 매수 추천</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          증권사 추천 종목
        </CardTitle>
        <CardDescription>
          애널리스트 TOP {recommendations.length} 매수 추천
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            추천 종목이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={`${rec.stock_code}-${index}`}
                className="rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{rec.stock_code}</span>
                      <span className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success border border-success/20 flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{rec.recommendation}</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.stock_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">예상 수익률</p>
                    <p className="text-xl font-bold text-success">
                      +{formatPercent(rec.upside_percent)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">현재가: </span>
                    <span className="font-semibold">{formatNumber(rec.current_price)}원</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">목표가: </span>
                    <span className="font-semibold text-blue-500">{formatNumber(rec.target_price)}원</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {rec.report_title}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, FileText, Calendar, Building2, User, ExternalLink, BarChart3 } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface StockReportHistory {
  id: number;
  report_id: number;
  report_date: string;
  report_title: string;
  report_category: string;
  house_name?: string;
  analyst_name?: string;
  current_price?: number;
  target_price?: number;
  recommendation?: string;
  adjustment_type?: string;
  profit_impact?: string;
  upside_percent?: number;
  pdf_url?: string;
}

interface StockInfo {
  stock_code: string;
  stock_name: string;
  total_reports: number;
  latest_report_date?: string;
  latest_target_price?: number;
  latest_recommendation?: string;
  avg_target_price?: number;
  avg_upside?: number;
}

interface TargetPriceHistory {
  date: string;
  target_price: number;
  current_price?: number;
  house_name?: string;
  recommendation?: string;
}

interface RecommendationSummary {
  recommendation: string;
  count: number;
  avg_target_price?: number;
  latest_date?: string;
}

export default function StockDetailPage() {
  const params = useParams();
  const stockCode = params.code as string;
  
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [reports, setReports] = useState<StockReportHistory[]>([]);
  const [priceHistory, setPriceHistory] = useState<TargetPriceHistory[]>([]);
  const [recommendationSummary, setRecommendationSummary] = useState<RecommendationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stockCode) {
      fetchStockDetail();
      fetchPriceHistory();
      fetchRecommendationSummary();
    }
  }, [stockCode]);

  const fetchStockDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/stocks/${stockCode}`);
      const data = await response.json();
      
      setStock(data.stock);
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch stock detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/stocks/${stockCode}/target-price-history`);
      const data = await response.json();
      
      setPriceHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch price history:", error);
    }
  };

  const fetchRecommendationSummary = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/stocks/${stockCode}/recommendation-summary`);
      const data = await response.json();
      
      setRecommendationSummary(data.summary || []);
    } catch (error) {
      console.error("Failed to fetch recommendation summary:", error);
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation?.toUpperCase()) {
      case "BUY":
      case "매수":
        return "text-success bg-success/10 border-success/20";
      case "HOLD":
      case "보유":
      case "중립":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "SELL":
      case "매도":
        return "text-danger bg-danger/10 border-danger/20";
      default:
        return "text-muted-foreground bg-muted border-muted";
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">종목 데이터 로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">종목을 찾을 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold">{stock.stock_name}</h1>
          <span className="text-xl text-muted-foreground">{stock.stock_code}</span>
          {stock.latest_recommendation && (
            <span className={`px-3 py-1 text-sm rounded-md border ${getRecommendationColor(stock.latest_recommendation)}`}>
              {stock.latest_recommendation}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          총 {stock.total_reports}개의 리포트 분석
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 리포트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.total_reports}</div>
            <p className="text-xs text-muted-foreground">증권사 리포트</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 목표가</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.latest_target_price ? `${formatNumber(stock.latest_target_price)}원` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stock.latest_report_date || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 목표가</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.avg_target_price ? `${formatNumber(stock.avg_target_price)}원` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">전체 리포트 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 상승 여력</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stock.avg_upside && stock.avg_upside > 0 ? 'text-success' : 'text-danger'}`}>
              {stock.avg_upside ? `${stock.avg_upside > 0 ? '+' : ''}${formatPercent(stock.avg_upside)}` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">목표가 대비</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">
            <BarChart3 className="mr-2 h-4 w-4" />
            목표가 추이
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            리포트 히스토리
          </TabsTrigger>
          <TabsTrigger value="summary">
            <TrendingUp className="mr-2 h-4 w-4" />
            투자의견 분포
          </TabsTrigger>
        </TabsList>

        {/* 목표가 추이 차트 */}
        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>목표가 변화 추이</CardTitle>
              <CardDescription>
                증권사별 목표가 변화를 시간순으로 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">목표가 데이터가 없습니다</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="target_price" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="목표가"
                      dot={{ r: 4 }}
                    />
                    {priceHistory.some(h => h.current_price) && (
                      <Line 
                        type="monotone" 
                        dataKey="current_price" 
                        stroke="#6b7280" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="현재가"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 리포트 히스토리 */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>리포트 히스토리</CardTitle>
              <CardDescription>
                시간순으로 정렬된 리포트 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">리포트가 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{report.report_date}</span>
                            {report.recommendation && (
                              <span className={`px-2 py-0.5 text-xs rounded-md border ${getRecommendationColor(report.recommendation)}`}>
                                {report.recommendation}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold">{report.report_title}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            {report.house_name && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-3 w-3" />
                                <span>{report.house_name}</span>
                              </div>
                            )}
                            {report.analyst_name && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{report.analyst_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {report.current_price && (
                          <div>
                            <p className="text-xs text-muted-foreground">현재가</p>
                            <p className="font-semibold">{formatNumber(report.current_price)}원</p>
                          </div>
                        )}
                        {report.target_price && (
                          <div>
                            <p className="text-xs text-muted-foreground">목표가</p>
                            <p className="font-semibold">{formatNumber(report.target_price)}원</p>
                          </div>
                        )}
                        {report.upside_percent !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">상승 여력</p>
                            <p className={`font-semibold ${report.upside_percent > 0 ? 'text-success' : 'text-danger'}`}>
                              {report.upside_percent > 0 ? '+' : ''}{formatPercent(report.upside_percent)}
                            </p>
                          </div>
                        )}
                        {report.adjustment_type && (
                          <div>
                            <p className="text-xs text-muted-foreground">조정 유형</p>
                            <p className="font-semibold">{report.adjustment_type}</p>
                          </div>
                        )}
                      </div>

                      {report.pdf_url && (
                        <a
                          href={report.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>네이버 금융에서 리포트 보기</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 투자의견 분포 */}
        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>투자의견 분포</CardTitle>
              <CardDescription>
                증권사들의 투자의견 통계
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationSummary.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">투자의견 데이터가 없습니다</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 파이 차트 */}
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={recommendationSummary}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ recommendation, percent }) => `${recommendation} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {recommendationSummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 통계 테이블 */}
                  <div className="space-y-3">
                    {recommendationSummary.map((item, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold ${getRecommendationColor(item.recommendation)}`}>
                            {item.recommendation}
                          </span>
                          <span className="text-sm text-muted-foreground">{item.count}개</span>
                        </div>
                        {item.avg_target_price && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">평균 목표가: </span>
                            <span className="font-semibold">{formatNumber(item.avg_target_price)}원</span>
                          </div>
                        )}
                        {item.latest_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            최근: {item.latest_date}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


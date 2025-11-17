"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, FileText, Calendar } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import Link from "next/link";

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

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStocks, setTotalStocks] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchStocks();
  }, [currentPage, searchTerm]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`http://localhost:8001/api/stocks?${params}`);
      const data = await response.json();
      
      setStocks(data.stocks || []);
      setTotalStocks(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation?.toUpperCase()) {
      case "BUY":
      case "매수":
        return "text-success";
      case "HOLD":
      case "보유":
      case "중립":
        return "text-orange-500";
      case "SELL":
      case "매도":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  const totalPages = Math.ceil(totalStocks / pageSize);

  if (loading && stocks.length === 0) {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">종목별 리포트 분석</h1>
        <p className="text-muted-foreground">
          증권사 리포트가 있는 종목의 목표가 및 투자의견 변화 추이를 확인하세요
        </p>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="종목 코드 또는 종목명으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 종목</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStocks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">리포트가 있는 종목</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 리포트 수</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stocks.length > 0 
                ? (stocks.reduce((sum, s) => sum + s.total_reports, 0) / stocks.length).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">종목당 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 상승 여력</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +{stocks.length > 0 && stocks.filter(s => s.avg_upside).length > 0
                ? (stocks.filter(s => s.avg_upside).reduce((sum, s) => sum + (s.avg_upside || 0), 0) / stocks.filter(s => s.avg_upside).length).toFixed(1)
                : "0"}%
            </div>
            <p className="text-xs text-muted-foreground">목표가 대비</p>
          </CardContent>
        </Card>
      </div>

      {/* 종목 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>종목 목록</CardTitle>
          <CardDescription>
            {totalStocks.toLocaleString()}개 중 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalStocks)}개 표시
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {stocks.map((stock) => (
                <Link
                  key={stock.stock_code}
                  href={`/stocks/${stock.stock_code}`}
                  className="block"
                >
                  <div className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-lg">{stock.stock_name}</h3>
                          <span className="text-sm text-muted-foreground">{stock.stock_code}</span>
                          {stock.latest_recommendation && (
                            <span className={`text-sm font-medium ${getRecommendationColor(stock.latest_recommendation)}`}>
                              {stock.latest_recommendation}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">리포트 수</p>
                            <p className="font-semibold">{stock.total_reports}개</p>
                          </div>
                          
                          {stock.latest_target_price && (
                            <div>
                              <p className="text-muted-foreground">최근 목표가</p>
                              <p className="font-semibold">{formatNumber(stock.latest_target_price)}원</p>
                            </div>
                          )}
                          
                          {stock.avg_target_price && (
                            <div>
                              <p className="text-muted-foreground">평균 목표가</p>
                              <p className="font-semibold">{formatNumber(stock.avg_target_price)}원</p>
                            </div>
                          )}
                          
                          {stock.avg_upside && (
                            <div>
                              <p className="text-muted-foreground">평균 상승 여력</p>
                              <p className={`font-semibold ${stock.avg_upside > 0 ? 'text-success' : 'text-danger'}`}>
                                {stock.avg_upside > 0 ? '+' : ''}{formatPercent(stock.avg_upside)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {stock.latest_report_date && (
                          <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>최근 리포트: {stock.latest_report_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              >
                이전
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-md border ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              >
                다음
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


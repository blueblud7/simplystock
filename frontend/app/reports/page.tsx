"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Building2, UserCheck, ExternalLink, Calendar, Tag } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ReportDetailModal } from "@/components/reports/report-detail-modal";

// 리포트 날짜 포맷팅 함수 (YY.MM.DD 형식 처리)
function formatReportDate(dateStr: string): string {
  if (!dateStr) return "날짜 없음";
  
  try {
    // YY.MM.DD 형식 처리 (예: "25.05.21")
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        // 20XX 또는 19XX로 변환 (YY가 50 이상이면 1900년대, 아니면 2000년대)
        const fullYear = year >= 50 ? 1900 + year : 2000 + year;
        
        return `${fullYear}. ${month}. ${day}.`;
      }
    }
    
    // ISO 형식이나 다른 형식 시도
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('ko-KR');
    }
    
    return dateStr; // 파싱 실패 시 원본 반환
  } catch (e) {
    return dateStr; // 에러 시 원본 반환
  }
}

interface StockInfo {
  name: string;
  recommendation?: string;
  upside?: number;
  adjustment_type?: string;  // 조정 유형: 상향/하향/유지
  profit_impact?: string;    // 수익 영향: 양호/보통/부진
}

interface Report {
  id: number;
  date: string;
  category: string;
  title: string;
  pdf_url?: string;
  sent: boolean;
  stocks?: StockInfo[];
  summary?: string;  // 요약 내용
}

interface ReportAnalysis {
  stock_code: string;
  stock_name: string;
  current_price: number;
  target_price: number;
  upside_percent: number;
  recommendation: string;
  analysis_date: string;
  report_title: string;
  pdf_url?: string;
}

interface House {
  id: number;
  name: string;
  total_reports: number;
}

interface Analyst {
  id: number;
  name: string;
  house: string;
  total_reports: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [topRecommendations, setTopRecommendations] = useState<ReportAnalysis[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reportsRes, topRes, housesRes, analystsRes] = await Promise.all([
          fetch(`http://localhost:8001/api/reports/?page=${currentPage}&page_size=${pageSize}`),
          fetch("http://localhost:8001/api/reports/top-recommendations?limit=10"),
          fetch("http://localhost:8001/api/reports/houses?limit=10"),
          fetch("http://localhost:8001/api/reports/analysts?limit=10")
        ]);

        const reportsData = await reportsRes.json();
        const topData = await topRes.json();
        const housesData = await housesRes.json();
        const analystsData = await analystsRes.json();

        // API 응답 형식에 맞게 처리
        setReports(reportsData.reports || []);
        setTotalReports(reportsData.total || reportsData.reports?.length || 0);
        setTopRecommendations(topData.recommendations || []);
        setHouses(housesData.houses || []);
        setAnalysts(analystsData.analysts || []);
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
        // 에러 시 빈 배열로 설정
        setReports([]);
        setTopRecommendations([]);
        setHouses([]);
        setAnalysts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">증권사 리포트</h1>
          <p className="text-muted-foreground">
            국내 증권사의 투자 리포트와 애널리스트 추천 종목
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">리포트 데이터 로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
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

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case "BUY":
      case "매수":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleReportClick = (reportId: number) => {
    setSelectedReportId(reportId);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalReports / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <ReportDetailModal 
        reportId={selectedReportId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">증권사 리포트</h1>
          <p className="text-muted-foreground">
            국내 증권사의 투자 리포트와 애널리스트 추천 종목 (전체 {totalReports.toLocaleString()}개)
          </p>
        </div>
        {/* 페이지 크기 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">페이지당:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-background hover:bg-accent cursor-pointer"
          >
            <option value={25}>25개</option>
            <option value={50}>50개</option>
          </select>
        </div>
      </div>

      {/* 상위 추천 종목 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-success" />
            상위 추천 종목
          </CardTitle>
          <CardDescription>
            목표 상승률이 높은 매수 추천 종목 (Top {topRecommendations.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRecommendations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">추천 종목이 없습니다</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topRecommendations.map((rec, index) => (
                <div
                  key={`${rec.stock_code}-${index}`}
                  className="rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-lg">{rec.stock_code}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-md border flex items-center space-x-1 ${getRecommendationColor(rec.recommendation)}`}>
                          {getRecommendationIcon(rec.recommendation)}
                          <span>{rec.recommendation}</span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.stock_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div>
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="font-semibold">{formatNumber(rec.current_price)}원</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">목표가</p>
                      <p className="font-semibold">{formatNumber(rec.target_price)}원</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-success/10 p-2 mb-2">
                    <p className="text-xs text-muted-foreground">예상 수익률</p>
                    <p className="text-xl font-bold text-success">+{formatPercent(rec.upside_percent)}</p>
                  </div>

                  <div className="text-xs text-muted-foreground truncate">
                    {rec.report_title}
                  </div>

                  {rec.pdf_url && (
                    <a
                      href={rec.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      리포트 보기
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            최신 리포트
          </TabsTrigger>
          <TabsTrigger value="houses">
            <Building2 className="mr-2 h-4 w-4" />
            증권사
          </TabsTrigger>
          <TabsTrigger value="analysts">
            <UserCheck className="mr-2 h-4 w-4" />
            애널리스트
          </TabsTrigger>
        </TabsList>

        {/* 최신 리포트 */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>최신 리포트</CardTitle>
              <CardDescription>
                최근 발행된 증권사 리포트 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">리포트가 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatReportDate(report.date)}
                          </span>
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{report.category}</span>
                        </div>
                        <h4 className="font-semibold">{report.title}</h4>
                        
                        {/* 요약 내용 표시 */}
                        {report.summary && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {report.summary}
                          </p>
                        )}
                        
                        {/* 분석 종목 정보 표시 */}
                        {report.stocks && report.stocks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {/* 요약 문구 */}
                            <p className="text-sm text-muted-foreground">
                              {report.stocks.map((stock, idx) => (
                                <span key={idx}>
                                  {idx > 0 && ', '}
                                  <span className="font-medium text-foreground">{stock.name}</span>
                                  {stock.adjustment_type && (
                                    <span> 목표가 {stock.adjustment_type}</span>
                                  )}
                                  {stock.profit_impact && (
                                    <span className={`ml-1 ${
                                      stock.profit_impact === '양호' ? 'text-success' : 
                                      stock.profit_impact === '부진' ? 'text-danger' : 
                                      'text-muted-foreground'
                                    }`}>
                                      (수익 {stock.profit_impact})
                                    </span>
                                  )}
                                </span>
                              ))}
                            </p>
                            
                            {/* 종목 뱃지 */}
                            <div className="flex flex-wrap gap-2">
                              {report.stocks.map((stock, idx) => (
                                <div key={idx} className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                                  <span className="font-medium">{stock.name}</span>
                                  {stock.recommendation && (
                                    <>
                                      <span>•</span>
                                      <span className={`${
                                        stock.recommendation === 'BUY' ? 'text-success' : 
                                        stock.recommendation === 'SELL' ? 'text-danger' : 
                                        'text-muted-foreground'
                                      }`}>
                                        {stock.recommendation}
                                      </span>
                                    </>
                                  )}
                                  {stock.upside !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className={stock.upside > 0 ? 'text-success' : 'text-danger'}>
                                        {stock.upside > 0 ? '+' : ''}{stock.upside.toFixed(1)}%
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {report.pdf_url && (
                        <a
                          href={report.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 flex items-center text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 증권사 */}
        <TabsContent value="houses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>증권사 순위</CardTitle>
              <CardDescription>
                리포트 발행 수 기준 상위 증권사
              </CardDescription>
            </CardHeader>
            <CardContent>
              {houses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">데이터가 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {houses.map((house, index) => (
                    <div
                      key={house.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{house.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {house.total_reports}개 리포트
                          </p>
                        </div>
                      </div>
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 애널리스트 */}
        <TabsContent value="analysts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>애널리스트 순위</CardTitle>
              <CardDescription>
                리포트 발행 수 기준 상위 애널리스트
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">데이터가 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {analysts.map((analyst, index) => (
                    <div
                      key={analyst.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{analyst.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {analyst.house} · {analyst.total_reports}개 리포트
                          </p>
                        </div>
                      </div>
                      <UserCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalReports.toLocaleString()}개 중 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalReports)}개 표시
              </p>
              
              <div className="flex items-center gap-2">
                {/* 이전 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {/* 페이지 번호 */}
                <div className="flex items-center gap-1">
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 border rounded-md hover:bg-accent"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2">...</span>}
                    </>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1 ||
                             page === currentPage - 2 ||
                             page === currentPage + 2;
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded-md hover:bg-accent ${
                          currentPage === page ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 border rounded-md hover:bg-accent"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* 다음 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 리포트 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>📊 리포트 통계</CardTitle>
          <CardDescription>증권사 리포트 데이터 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">전체 리포트</p>
              <p className="text-3xl font-bold">{reports.length}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-4">
              <p className="text-sm text-muted-foreground mb-1">매수 추천</p>
              <p className="text-3xl font-bold text-success">{topRecommendations.length}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-4">
              <p className="text-sm text-muted-foreground mb-1">활동 증권사</p>
              <p className="text-3xl font-bold text-blue-500">{houses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


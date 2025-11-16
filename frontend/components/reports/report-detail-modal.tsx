"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Calendar, Tag, Building2, FileText, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

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

interface StockAnalysis {
  id: number;
  stock_code: string;
  stock_name: string;
  current_price: number;
  target_price: number;
  price_change?: number;
  upside_percent: number;
  recommendation: string;
  adjustment_type?: string;
  profit_impact?: string;
}

interface Report {
  id: number;
  date: string;
  category: string;
  title: string;
  summary?: string;
  pdf_url?: string;
}

interface ReportDetailModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDetailModal({ reportId, isOpen, onClose }: ReportDetailModalProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportId && isOpen) {
      fetchReportDetail();
    }
  }, [reportId, isOpen]);

  const fetchReportDetail = async () => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8001/api/reports/${reportId}`);
      const data = await response.json();
      
      setReport(data.report);
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error("Failed to fetch report detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
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

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation?.toUpperCase()) {
      case "BUY":
      case "매수":
        return <TrendingUp className="h-4 w-4" />;
      case "SELL":
      case "매도":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3">
            <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              {report?.title || "리포트 상세"}
              {report && (
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-normal">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatReportDate(report.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {report.category}
                  </div>
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            이 리포트에 포함된 종목 분석 정보입니다
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">데이터 로딩 중...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* 요약 내용 전체 표시 */}
            {report?.summary && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-lg">요약 내용</h3>
                  </div>
                  {report?.pdf_url && (
                    <a
                      href={report.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                      네이버에서 리포트 보기
                    </a>
                  )}
                </div>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {report.summary.split('\n').map((line, idx) => {
                    // 불릿 포인트나 번호가 있는 줄 처리
                    if (line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\.\s/)) {
                      return (
                        <div key={idx} className="mb-2 pl-4">
                          {line.trim()}
                        </div>
                      );
                    }
                    // 일반 텍스트 줄
                    if (line.trim()) {
                      return (
                        <p key={idx} className="mb-2">
                          {line.trim()}
                        </p>
                      );
                    }
                    // 빈 줄
                    return <br key={idx} />;
                  })}
                </div>
              </div>
            )}
            
            {/* 네이버 링크 (요약이 없을 때도 표시) */}
            {!report?.summary && report?.pdf_url && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <a
                  href={report.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="font-semibold">네이버 금융에서 리포트 보기</span>
                </a>
              </div>
            )}
            
            {analyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>이 리포트에는 종목 분석 정보가 없습니다</p>
              </div>
            ) : (
              <>
                {/* 요약 통계 */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">전체 종목</p>
                    <p className="text-2xl font-bold">{analyses.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">매수 추천</p>
                    <p className="text-2xl font-bold text-success">
                      {analyses.filter(a => a.recommendation?.toUpperCase() === "BUY").length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">평균 상승률</p>
                    <p className="text-2xl font-bold text-blue-500">
                      +{formatPercent(
                        analyses.reduce((sum, a) => sum + (a.upside_percent || 0), 0) / analyses.length
                      )}
                    </p>
                  </div>
                </div>

                {/* 종목 분석 목록 */}
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-bold text-lg">{analysis.stock_code}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-md border flex items-center space-x-1 ${getRecommendationColor(analysis.recommendation)}`}>
                              {getRecommendationIcon(analysis.recommendation)}
                              <span>{analysis.recommendation}</span>
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{analysis.stock_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">예상 수익률</p>
                          <p className={`text-xl font-bold ${
                            analysis.upside_percent > 0 ? "text-success" : 
                            analysis.upside_percent < 0 ? "text-danger" : 
                            "text-muted-foreground"
                          }`}>
                            {analysis.upside_percent > 0 ? "+" : ""}
                            {formatPercent(analysis.upside_percent)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">현재가</p>
                          <p className="text-lg font-semibold">
                            {formatNumber(analysis.current_price)}원
                          </p>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 p-3">
                          <p className="text-xs text-muted-foreground mb-1">목표가</p>
                          <p className="text-lg font-semibold text-blue-500">
                            {formatNumber(analysis.target_price)}원
                          </p>
                        </div>
                      </div>

                      {(analysis.adjustment_type || analysis.profit_impact) && (
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          {analysis.adjustment_type && (
                            <span className="px-2 py-1 bg-muted rounded">
                              {analysis.adjustment_type}
                            </span>
                          )}
                          {analysis.profit_impact && (
                            <span className="px-2 py-1 bg-muted rounded">
                              {analysis.profit_impact}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


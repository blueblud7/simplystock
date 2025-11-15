"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Calendar, Tag, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: {
    id: string;
    title: string;
    summary?: string;
    source: string;
    url: string;
    published_at: string;
    sentiment?: string;
  } | null;
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="h-4 w-4 text-success" />;
    case "negative":
      return <TrendingDown className="h-4 w-4 text-danger" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function getSentimentBadge(sentiment: string) {
  const colors = {
    positive: "bg-success/10 text-success border-success/20",
    negative: "bg-danger/10 text-danger border-danger/20",
    neutral: "bg-muted text-muted-foreground border-muted"
  };
  const labels = {
    positive: "긍정",
    negative: "부정",
    neutral: "중립"
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-md border ${colors[sentiment as keyof typeof colors] || colors.neutral}`}>
      {labels[sentiment as keyof typeof labels] || labels.neutral}
    </span>
  );
}

export function NewsModal({ isOpen, onClose, news }: NewsModalProps) {
  if (!news) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-tight pr-8">
            {news.title}
          </DialogTitle>
          <DialogDescription asChild>
            <span className="flex items-center gap-3 text-sm flex-wrap mt-2">
              <span className="flex items-center gap-1">
                {getSentimentIcon(news.sentiment || "neutral")}
                {getSentimentBadge(news.sentiment || "neutral")}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>{news.source}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(new Date(news.published_at))}</span>
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* 뉴스 요약 */}
          {news.summary && news.summary !== news.title && (
            <div className="rounded-lg bg-muted/50 p-6 border">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">📝 요약</h3>
              <p className="text-base leading-relaxed">{news.summary}</p>
            </div>
          )}

          {/* 기사 정보 */}
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">ℹ️ 기사 정보</h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">출처</p>
                  <p className="text-sm text-muted-foreground">{news.source}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">발행 시간</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(news.published_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {news.sentiment && (
                <div className="flex items-start gap-3">
                  {getSentimentIcon(news.sentiment)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">감성 분석</p>
                    <p className="text-sm text-muted-foreground">
                      {news.sentiment === 'positive' ? '긍정적' : news.sentiment === 'negative' ? '부정적' : '중립'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 전체 기사 읽기 */}
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">📰 전체 기사 읽기</h3>
              <p className="text-sm text-muted-foreground">
                전체 기사 내용은 원본 사이트에서 확인하실 수 있습니다
              </p>
            </div>
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-5 w-5" />
              원문 보러가기
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

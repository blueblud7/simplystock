"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// 임시 뉴스 데이터
const news = [
  {
    id: 1,
    title: "연준, 기준금리 동결 결정...인플레이션 압력 완화",
    summary: "연방준비제도가 기준금리를 5.25-5.50%로 유지하기로 결정했습니다. 최근 인플레이션 지표가 완화되는 모습을 보이면서...",
    sentiment: "neutral",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    source: "Bloomberg",
  },
  {
    id: 2,
    title: "엔비디아, AI 칩 수요 급증으로 매출 전망 상향",
    summary: "엔비디아가 데이터센터용 AI 칩의 수요 급증으로 다음 분기 매출 전망을 기존 전망치보다 20% 상향 조정했습니다...",
    sentiment: "positive",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    source: "CNBC",
  },
  {
    id: 3,
    title: "테슬라 중국 판매 부진...전기차 경쟁 심화",
    summary: "테슬라의 중국 시장 판매가 전월 대비 18% 감소하며 현지 경쟁사들의 공세에 밀리는 모습입니다...",
    sentiment: "negative",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    source: "Reuters",
  },
  {
    id: 4,
    title: "애플, 비전 프로 출시 준비 완료...공간 컴퓨팅 시대 개막",
    summary: "애플이 첫 혼합현실 헤드셋 비전 프로의 출시를 앞두고 최종 준비를 마쳤습니다. 개발자들의 초기 반응은 긍정적...",
    sentiment: "positive",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    source: "The Verge",
  },
];

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

export function NewsFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Newspaper className="mr-2 h-5 w-5" />
          최신 뉴스
        </CardTitle>
        <CardDescription>
          AI가 요약한 주요 시장 뉴스
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getSentimentIcon(item.sentiment)}
                    <span className="text-xs text-muted-foreground">
                      {item.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      •
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.summary}
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


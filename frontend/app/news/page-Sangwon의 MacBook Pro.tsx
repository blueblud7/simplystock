"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, TrendingDown, Minus, Search, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  sentiment: string;
  sentimentScore: number;
  timestamp: Date;
  source: string;
  category: string;
  tickers?: string[];
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
    neutral: "bg-muted text-muted-foreground border-muted",
  };
  
  const labels = {
    positive: "긍정",
    negative: "부정",
    neutral: "중립",
  };
  
  return (
    <span className={`px-2 py-1 text-xs rounded-md border ${colors[sentiment as keyof typeof colors]}`}>
      {labels[sentiment as keyof typeof labels]}
    </span>
  );
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log("Fetching news from http://localhost:8001/api/news/");
        const response = await fetch("http://localhost:8001/api/news/?page=1&page_size=20");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("News data received:", data);

        const articles = data.articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          summary: article.summary || article.title,
          content: article.content,
          sentiment: article.sentiment || "neutral",
          sentimentScore: article.sentiment_score || 0,
          timestamp: new Date(article.published_at),
          source: article.source,
          category: article.category || "general",
          tickers: article.tickers || []
        }));

        setAllNews(articles);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setAllNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">뉴스 허브</h1>
          <p className="text-muted-foreground">
            AI가 분석한 실시간 금융 뉴스
          </p>
        </div>
        
        {/* 검색 및 필터 (추후 구현) */}
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-accent">
            <Search className="h-4 w-4" />
            <span>검색</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-accent">
            <Filter className="h-4 w-4" />
            <span>필터</span>
          </button>
        </div>
      </div>

      {/* 트렌딩 토픽 */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 트렌딩 토픽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["AI 반도체", "금리 정책", "전기차", "빅테크 실적", "중국 경제", "부동산"].map((topic) => (
              <button
                key={topic}
                className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 뉴스 탭 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="positive">긍정</TabsTrigger>
          <TabsTrigger value="negative">부정</TabsTrigger>
          <TabsTrigger value="earnings">실적</TabsTrigger>
          <TabsTrigger value="policy">정책</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : allNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">뉴스가 없습니다.</div>
          ) : (
            allNews.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getSentimentIcon(article.sentiment)}
                    <span className="text-xs text-muted-foreground">
                      {article.source}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(article.timestamp)}
                    </span>
                  </div>
                  {getSentimentBadge(article.sentiment)}
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {article.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {article.category}
                    </span>
                    {article.tickers?.map((ticker) => (
                      <span key={ticker} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                        ${ticker}
                      </span>
                    ))}
                  </div>
                  
                  <button className="text-xs text-primary hover:underline">
                    자세히 보기 →
                  </button>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>
        
        {/* 다른 탭들도 비슷하게 구현 */}
        <TabsContent value="positive">
          <p className="text-muted-foreground">긍정 뉴스만 표시...</p>
        </TabsContent>
        
        <TabsContent value="negative">
          <p className="text-muted-foreground">부정 뉴스만 표시...</p>
        </TabsContent>
      </Tabs>

      {/* AI 일일 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 AI 시장 브리핑</CardTitle>
          <CardDescription>오늘의 주요 뉴스를 AI가 요약했습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              오늘 시장은 연준의 금리 동결 결정에 긍정적으로 반응했습니다. 
              인플레이션이 완화되는 모습을 보이면서 투자자들의 심리가 개선되었고, 
              주요 지수들이 상승 마감했습니다.
            </p>
            
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2">핵심 포인트</h4>
              <ul className="space-y-1 text-sm">
                <li>• 연준 기준금리 5.25-5.50% 동결</li>
                <li>• 엔비디아, AI 칩 수요로 매출 전망 상향</li>
                <li>• 테슬라, 중국 시장 판매 부진</li>
                <li>• 기술주 중심의 상승세</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


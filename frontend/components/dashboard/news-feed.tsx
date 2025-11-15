"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { NewsModal } from "@/components/news/news-modal";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: string;
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

export function NewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/news/?page_size=8");
        const data = await response.json();
        setNews(data.articles || []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    
    // 5분마다 자동 새로고침
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNewsClick = (newsItem: NewsArticle) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2 h-5 w-5" />
            최신 뉴스
          </CardTitle>
          <CardDescription>
            QuickNews DB에서 실시간 뉴스 제공
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
    <>
      <NewsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        news={selectedNews}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2 h-5 w-5" />
            최신 뉴스
          </CardTitle>
                <CardDescription>
                  최신 금융 뉴스 ({news.length}개) • 5분마다 자동 업데이트
                </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {news.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                뉴스가 없습니다.
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNewsClick(item)}
                  className="block rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer"
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
                        {formatDateTime(new Date(item.published_at))}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <h4 className="font-semibold mb-2 flex-1">{item.title}</h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    {item.summary && item.summary !== item.title && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, TrendingDown, Minus, Search, Filter, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { NewsModal } from "@/components/news/news-modal";

interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  sentiment: string;
  sentiment_score?: number;
  published_at: string;
  source: string;
  category?: string;
  tickers?: string[];
  url: string;
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
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalNews, setTotalNews] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8001/api/news/?page=${currentPage}&page_size=${pageSize}`);
        const data = await response.json();
        setAllNews(data.articles || []);
        setTotalNews(data.total || 0);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setAllNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage, pageSize]);

  const handleNewsClick = (newsItem: NewsArticle) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalNews / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">뉴스 허브</h1>
          <p className="text-muted-foreground">
            AI가 분석한 실시간 금융 뉴스
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">뉴스 로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NewsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        news={selectedNews}
      />
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">뉴스 허브</h1>
          <p className="text-muted-foreground">
            실시간 금융 뉴스 (전체 {totalNews.toLocaleString()}개)
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

      {/* 트렌딩 토픽 */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 최신 뉴스</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allNews.slice(0, 6).map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
              >
                {article.source}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 뉴스 탭 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">전체 ({allNews.length})</TabsTrigger>
          <TabsTrigger value="positive">긍정 ({allNews.filter(n => n.sentiment === "positive").length})</TabsTrigger>
          <TabsTrigger value="negative">부정 ({allNews.filter(n => n.sentiment === "negative").length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          {allNews.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">뉴스가 없습니다.</p>
              </CardContent>
            </Card>
                ) : (
                  allNews.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleNewsClick(article)}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getSentimentIcon(article.sentiment)}
                        <span className="text-xs text-muted-foreground">
                          {article.source}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(new Date(article.published_at))}
                        </span>
                      </div>
                      {getSentimentBadge(article.sentiment)}
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <h3 className="text-lg font-semibold mb-2 flex-1">{article.title}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    
                    {article.summary && article.summary !== article.title && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {article.category && (
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {article.category}
                          </span>
                        )}
                        {article.tickers?.map((ticker) => (
                          <span key={ticker} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                            ${ticker}
                          </span>
                        ))}
                      </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </TabsContent>
        
        {/* 긍정 뉴스 탭 */}
        <TabsContent value="positive" className="space-y-4 mt-6">
          {allNews.filter(n => n.sentiment === "positive").map((article) => (
            <div 
              key={article.id} 
              onClick={() => handleNewsClick(article)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(article.sentiment)}
                      <span className="text-xs text-muted-foreground">{article.source}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(article.published_at))}
                      </span>
                    </div>
                    {getSentimentBadge(article.sentiment)}
                  </div>
                  <div className="flex items-start gap-2">
                    <h3 className="text-lg font-semibold mb-2 flex-1">{article.title}</h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </TabsContent>
        
        {/* 부정 뉴스 탭 */}
        <TabsContent value="negative" className="space-y-4 mt-6">
          {allNews.filter(n => n.sentiment === "negative").map((article) => (
            <div 
              key={article.id} 
              onClick={() => handleNewsClick(article)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(article.sentiment)}
                      <span className="text-xs text-muted-foreground">{article.source}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(article.published_at))}
                      </span>
                    </div>
                    {getSentimentBadge(article.sentiment)}
                  </div>
                  <div className="flex items-start gap-2">
                    <h3 className="text-lg font-semibold mb-2 flex-1">{article.title}</h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalNews.toLocaleString()}개 중 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalNews)}개 표시
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

      {/* 뉴스 통계 */}
      {allNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 뉴스 통계</CardTitle>
            <CardDescription>현재 로드된 뉴스 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">감성 분석</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-success font-semibold">긍정: </span>
                    <span>{allNews.filter(n => n.sentiment === "positive").length}개</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">중립: </span>
                    <span>{allNews.filter(n => n.sentiment === "neutral").length}개</span>
                  </div>
                  <div>
                    <span className="text-danger font-semibold">부정: </span>
                    <span>{allNews.filter(n => n.sentiment === "negative").length}개</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">주요 출처</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(allNews.map(n => n.source))).slice(0, 10).map(source => (
                    <span key={source} className="text-xs px-2 py-1 bg-background rounded">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


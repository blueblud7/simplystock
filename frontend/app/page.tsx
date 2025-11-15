import { MarketOverview } from "@/components/dashboard/market-overview";
import { SectorHeatmap } from "@/components/dashboard/sector-heatmap";
import { MacroIndicators } from "@/components/dashboard/macro-indicators";
import { Week52Highlights } from "@/components/dashboard/52week-highlights";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { ReportHighlights } from "@/components/dashboard/report-highlights";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            오늘의 시장 상황을 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* 주요 지표 */}
      <MarketOverview />

      {/* 매크로 지표 */}
      <MacroIndicators />

      {/* 52주 신고가/신저가 하이라이트 */}
      <Week52Highlights />

      {/* 섹터별 히트맵 */}
      <SectorHeatmap />

      {/* 뉴스 & 리포트 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 최신 뉴스 */}
        <NewsFeed />
        
        {/* 증권사 추천 종목 */}
        <ReportHighlights />
      </div>
    </div>
  );
}


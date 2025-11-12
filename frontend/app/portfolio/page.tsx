"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, TrendingUp, TrendingDown } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 포트폴리오</h1>
          <p className="text-muted-foreground">
            보유 종목을 추적하고 리스크를 분석합니다
          </p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          <span>종목 추가</span>
        </button>
      </div>

      {/* 포트폴리오가 비어있을 때 */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">포트폴리오가 비어있습니다</h3>
          <p className="text-sm text-muted-foreground mb-6">
            종목을 추가하여 포트폴리오 분석을 시작하세요
          </p>
          <button className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            <span>첫 종목 추가하기</span>
          </button>
        </CardContent>
      </Card>

      {/* 기능 소개 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">리스크 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              포트폴리오의 변동성, 섹터 집중도, 매크로 리스크를 분석합니다.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">매크로 시나리오</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              금리, 환율 변화 시 포트폴리오 영향을 시뮬레이션합니다.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">추천 자산 배분</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              현재 시장 환경에 맞는 최적 자산 배분을 제안합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


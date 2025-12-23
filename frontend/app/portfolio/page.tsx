"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, TrendingUp, TrendingDown, X, Edit2, Trash2, Save, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

interface PortfolioHolding {
  id: string;
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [newHolding, setNewHolding] = useState({
    stockCode: "",
    stockName: "",
    quantity: 0,
    averagePrice: 0,
  });
  const [editingHolding, setEditingHolding] = useState<Partial<PortfolioHolding>>({});

  // 로컬 스토리지에서 포트폴리오 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("simplystock_portfolio");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPortfolios(data);
      } catch (e) {
        console.error("포트폴리오 로드 실패:", e);
      }
    }
  }, []);

  // 포트폴리오 저장
  const savePortfolios = (updated: Portfolio[]) => {
    setPortfolios(updated);
    localStorage.setItem("simplystock_portfolio", JSON.stringify(updated));
  };

  // 종목 코드로 국가 판단 (한국/미국만)
  const getStockRegion = (stockCode: string): "KR" | "US" => {
    // 한국 종목: 6자리 숫자
    if (/^\d{6}$/.test(stockCode)) {
      return "KR";
    }
    
    // 기본값: 미국 종목
    return "US";
  };

  // 각 나라별 장 시간 체크 (한국/미국만)
  const isMarketOpenForStock = (stockCode: string): boolean => {
    const region = getStockRegion(stockCode);
    const now = new Date();
    
    // 한국 종목: 한국 시간 기준
    if (region === "KR") {
      const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const hour = koreaTime.getHours();
      const minute = koreaTime.getMinutes();
      const day = koreaTime.getDay();
      
      // 주말 체크
      if (day === 0 || day === 6) {
        return false;
      }
      
      // 장 시간: 09:00 ~ 15:30 (한국 시간)
      const marketStart = 9 * 60;
      const marketEnd = 15 * 60 + 30;
      const currentMinutes = hour * 60 + minute;
      
      return currentMinutes >= marketStart && currentMinutes <= marketEnd;
    }
    
    // 미국 종목: 미국 동부 시간 기준
    if (region === "US") {
      const usTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const hour = usTime.getHours();
      const minute = usTime.getMinutes();
      const day = usTime.getDay();
      
      // 주말 체크
      if (day === 0 || day === 6) {
        return false;
      }
      
      // 장 시간: 09:30 ~ 16:00 (미국 동부 시간)
      const marketStart = 9 * 60 + 30;
      const marketEnd = 16 * 60;
      const currentMinutes = hour * 60 + minute;
      
      return currentMinutes >= marketStart && currentMinutes <= marketEnd;
    }
    
    return false;
  };

  // 전체 포트폴리오의 장 시간 체크 (하나라도 열려있으면 true)
  const isAnyMarketOpen = (): boolean => {
    const defaultPortfolio = portfolios[0];
    if (!defaultPortfolio || defaultPortfolio.holdings.length === 0) {
      return false;
    }
    
    // 하나라도 장이 열려있으면 true
    return defaultPortfolio.holdings.some(holding => 
      isMarketOpenForStock(holding.stockCode)
    );
  };

  // 현재가 조회 (실제 API 호출)
  const fetchCurrentPrice = async (stockCode: string): Promise<number> => {
    try {
      const response = await fetch(getApiUrl(`/api/stocks/price/${stockCode}`));
      if (!response.ok) {
        throw new Error(`가격 조회 실패: ${response.status}`);
      }
      const data = await response.json();
      return data.current_price || 0;
    } catch (e) {
      console.error(`가격 조회 실패 (${stockCode}):`, e);
      // 네트워크 오류 시 기본값 반환 (0은 업데이트 안 함을 의미)
      return 0;
    }
  };

  // 모든 종목의 현재가 업데이트
  const updateAllPrices = useCallback(async (force: boolean = false) => {
    const defaultPortfolio = portfolios[0];
    if (!defaultPortfolio || defaultPortfolio.holdings.length === 0) {
      return;
    }

    // 강제 업데이트가 아니면, 각 종목의 장 시간을 체크
    if (!force) {
      const hasOpenMarkets = isAnyMarketOpen();
      if (!hasOpenMarkets) {
        console.log("모든 종목의 장 시간이 아니므로 가격 업데이트를 건너뜁니다.");
        return;
      }
    }

    setUpdatingPrices(true);
    try {
      const updatedHoldings = await Promise.all(
        defaultPortfolio.holdings.map(async (holding) => {
          // 강제 업데이트가 아니면, 해당 종목의 장 시간을 체크
          if (!force && !isMarketOpenForStock(holding.stockCode)) {
            console.log(`${holding.stockName}(${holding.stockCode})의 장 시간이 아니므로 건너뜁니다.`);
            return holding; // 기존 데이터 유지
          }
          
          const currentPrice = await fetchCurrentPrice(holding.stockCode);
          if (currentPrice > 0) {
            const currentValue = holding.quantity * currentPrice;
            const holdingCost = holding.quantity * holding.averagePrice;
            const profitLoss = currentValue - holdingCost;
            const profitLossPercent = (profitLoss / holdingCost) * 100;

            return {
              ...holding,
              currentPrice,
              currentValue,
              profitLoss,
              profitLossPercent,
            };
          }
          return holding;
        })
      );

      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalCost = updatedHoldings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
      const totalReturn = totalValue - totalCost;
      const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      const updatedPortfolio: Portfolio = {
        ...defaultPortfolio,
        holdings: updatedHoldings,
        totalValue,
        totalCost,
        totalReturn,
        totalReturnPercent,
      };

      const updatedPortfolios = portfolios.map(p => 
        p.id === defaultPortfolio.id ? updatedPortfolio : p
      );

      savePortfolios(updatedPortfolios);
    } catch (error) {
      console.error("가격 업데이트 실패:", error);
    } finally {
      setUpdatingPrices(false);
    }
  }, [portfolios]);

  // 페이지 진입 시 가격 업데이트 (장 시간일 때만)
  useEffect(() => {
    if (portfolios.length === 0 || !portfolios[0]?.holdings.length) {
      return;
    }

    // 초기 로드 시 하나라도 장이 열려있으면 업데이트
    if (isAnyMarketOpen()) {
      updateAllPrices(false);
    }
  }, [portfolios.length]); // updateAllPrices 의존성 제거 (무한 루프 방지)

  // 보유 종목 추가
  const handleAddHolding = async () => {
    if (!newHolding.stockCode || !newHolding.stockName || newHolding.quantity <= 0 || newHolding.averagePrice <= 0) {
      alert("모든 필드를 올바르게 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const currentPrice = await fetchCurrentPrice(newHolding.stockCode);
      if (currentPrice === 0) {
        alert("종목 가격을 가져올 수 없습니다. 종목 코드를 확인해주세요.");
        setLoading(false);
        return;
      }

      const currentValue = newHolding.quantity * currentPrice;
      const holdingCost = newHolding.quantity * newHolding.averagePrice;
      const profitLoss = currentValue - holdingCost;
      const profitLossPercent = (profitLoss / holdingCost) * 100;

      const holding: PortfolioHolding = {
        id: Date.now().toString(),
        ...newHolding,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
      };

      const defaultPortfolio: Portfolio = portfolios[0] || {
        id: "default",
        name: "내 포트폴리오",
        holdings: [],
        totalValue: 0,
        totalCost: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      };

      const updatedHoldings = [...defaultPortfolio.holdings, holding];
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalCost = updatedHoldings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
      const totalReturn = totalValue - totalCost;
      const totalReturnPercent = (totalReturn / totalCost) * 100;

      const updatedPortfolio: Portfolio = {
        ...defaultPortfolio,
        holdings: updatedHoldings,
        totalValue,
        totalCost,
        totalReturn,
        totalReturnPercent,
      };

      const updatedPortfolios = portfolios.length > 0 
        ? portfolios.map(p => p.id === defaultPortfolio.id ? updatedPortfolio : p)
        : [updatedPortfolio];

      savePortfolios(updatedPortfolios);
      setNewHolding({ stockCode: "", stockName: "", quantity: 0, averagePrice: 0 });
      setIsAdding(false);
    } catch (error) {
      console.error("종목 추가 실패:", error);
      alert("종목 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 보유 종목 수정 시작
  const handleStartEdit = (holding: PortfolioHolding) => {
    setEditingId(holding.id);
    setEditingHolding({
      quantity: holding.quantity,
      averagePrice: holding.averagePrice,
    });
  };

  // 보유 종목 수정 저장
  const handleSaveEdit = async (portfolioId: string, holdingId: string) => {
    if (!editingHolding.quantity || editingHolding.quantity <= 0 || !editingHolding.averagePrice || editingHolding.averagePrice <= 0) {
      alert("수량과 평균 매입가는 0보다 커야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const updated = portfolios.map(portfolio => {
        if (portfolio.id === portfolioId) {
          const updatedHoldings = portfolio.holdings.map(holding => {
            if (holding.id === holdingId) {
              const quantity = editingHolding.quantity || holding.quantity;
              const averagePrice = editingHolding.averagePrice || holding.averagePrice;
              const currentPrice = holding.currentPrice;
              const currentValue = quantity * currentPrice;
              const holdingCost = quantity * averagePrice;
              const profitLoss = currentValue - holdingCost;
              const profitLossPercent = (profitLoss / holdingCost) * 100;

              return {
                ...holding,
                quantity,
                averagePrice,
                currentValue,
                profitLoss,
                profitLossPercent,
              };
            }
            return holding;
          });

          const totalValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
          const totalCost = updatedHoldings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
          const totalReturn = totalValue - totalCost;
          const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

          return {
            ...portfolio,
            holdings: updatedHoldings,
            totalValue,
            totalCost,
            totalReturn,
            totalReturnPercent,
          };
        }
        return portfolio;
      });

      savePortfolios(updated);
      setEditingId(null);
      setEditingHolding({});
    } catch (error) {
      console.error("수정 실패:", error);
      alert("수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingHolding({});
  };

  // 보유 종목 삭제
  const handleDeleteHolding = (portfolioId: string, holdingId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    const updated = portfolios.map(portfolio => {
      if (portfolio.id === portfolioId) {
        const updatedHoldings = portfolio.holdings.filter(h => h.id !== holdingId);
        const totalValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalCost = updatedHoldings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
        const totalReturn = totalValue - totalCost;
        const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

        return {
          ...portfolio,
          holdings: updatedHoldings,
          totalValue,
          totalCost,
          totalReturn,
          totalReturnPercent,
        };
      }
      return portfolio;
    });
    savePortfolios(updated);
  };

  const defaultPortfolio = portfolios[0] || null;

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
        
        <div className="flex items-center gap-2">
          {defaultPortfolio && defaultPortfolio.holdings.length > 0 && (
            <button
              onClick={() => updateAllPrices(true)}
              disabled={updatingPrices}
              className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
              title={!isAnyMarketOpen() ? "장 시간이 아닙니다 (강제 업데이트)" : "가격 새로고침"}
            >
              <RefreshCw className={`h-4 w-4 ${updatingPrices ? 'animate-spin' : ''}`} />
              <span>가격 새로고침</span>
            </button>
          )}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>종목 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* 종목 추가 폼 */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>종목 추가</CardTitle>
            <CardDescription>보유 종목 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">종목 코드</label>
                  <input
                    type="text"
                    value={newHolding.stockCode}
                    onChange={(e) => setNewHolding({ ...newHolding, stockCode: e.target.value })}
                    placeholder="예: 005930"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">종목명</label>
                  <input
                    type="text"
                    value={newHolding.stockName}
                    onChange={(e) => setNewHolding({ ...newHolding, stockName: e.target.value })}
                    placeholder="예: 삼성전자"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">보유 수량</label>
                  <input
                    type="number"
                    value={newHolding.quantity || ""}
                    onChange={(e) => setNewHolding({ ...newHolding, quantity: Number(e.target.value) })}
                    placeholder="예: 10"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">평균 매입가</label>
                  <input
                    type="number"
                    value={newHolding.averagePrice || ""}
                    onChange={(e) => setNewHolding({ ...newHolding, averagePrice: Number(e.target.value) })}
                    placeholder="예: 70000"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddHolding}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "추가 중..." : "추가"}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewHolding({ stockCode: "", stockName: "", quantity: 0, averagePrice: 0 });
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  취소
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 포트폴리오가 비어있을 때 */}
      {!defaultPortfolio || defaultPortfolio.holdings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">포트폴리오가 비어있습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              종목을 추가하여 포트폴리오 분석을 시작하세요
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>첫 종목 추가하기</span>
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 포트폴리오 요약 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 자산</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(defaultPortfolio.totalValue)}원</div>
                <p className="text-xs text-muted-foreground">현재 가치</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 투자금</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(defaultPortfolio.totalCost)}원</div>
                <p className="text-xs text-muted-foreground">매입 원가</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">손익</CardTitle>
                {defaultPortfolio.totalReturn >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  defaultPortfolio.totalReturn >= 0 ? "text-success" : "text-danger"
                }`}>
                  {defaultPortfolio.totalReturn >= 0 ? "+" : ""}{formatNumber(defaultPortfolio.totalReturn)}원
                </div>
                <p className="text-xs text-muted-foreground">평가 손익</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">수익률</CardTitle>
                {defaultPortfolio.totalReturnPercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  defaultPortfolio.totalReturnPercent >= 0 ? "text-success" : "text-danger"
                }`}>
                  {formatPercent(defaultPortfolio.totalReturnPercent)}
                </div>
                <p className="text-xs text-muted-foreground">수익률</p>
              </CardContent>
            </Card>
          </div>

          {/* 보유 종목 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>보유 종목</CardTitle>
              <CardDescription>
                {defaultPortfolio.holdings.length}개 종목 보유 중 {updatingPrices && "(가격 업데이트 중...)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {defaultPortfolio.holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    {editingId === holding.id ? (
                      // 수정 모드
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{holding.stockName}</h3>
                            <span className="text-sm text-muted-foreground">{holding.stockCode}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">보유 수량</label>
                            <input
                              type="number"
                              value={editingHolding.quantity || ""}
                              onChange={(e) => setEditingHolding({ ...editingHolding, quantity: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">평균 매입가</label>
                            <input
                              type="number"
                              value={editingHolding.averagePrice || ""}
                              onChange={(e) => setEditingHolding({ ...editingHolding, averagePrice: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(defaultPortfolio.id, holding.id)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            <span>저장</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-accent"
                          >
                            <X className="h-4 w-4" />
                            <span>취소</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-lg">{holding.stockName}</h3>
                            <span className="text-sm text-muted-foreground">{holding.stockCode}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">보유 수량</p>
                              <p className="font-semibold">{holding.quantity}주</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">평균 매입가</p>
                              <p className="font-semibold">{formatNumber(holding.averagePrice)}원</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">현재가</p>
                              <p className="font-semibold">{formatNumber(holding.currentPrice)}원</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">평가 손익</p>
                              <p className={`font-semibold ${
                                holding.profitLoss >= 0 ? "text-success" : "text-danger"
                              }`}>
                                {holding.profitLoss >= 0 ? "+" : ""}{formatNumber(holding.profitLoss)}원
                              </p>
                              <p className={`text-xs ${
                                holding.profitLossPercent >= 0 ? "text-success" : "text-danger"
                              }`}>
                                ({formatPercent(holding.profitLossPercent)})
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleStartEdit(holding)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(defaultPortfolio.id, holding.id)}
                            className="p-2 text-muted-foreground hover:text-danger transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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

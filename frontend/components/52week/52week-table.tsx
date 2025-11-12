"use client";

import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  daysAtHigh?: number;
  daysAtLow?: number;
  sector: string;
  marketCap: number;
  volume: number;
}

interface Week52TableProps {
  stocks: Stock[];
  type: 'high' | 'low';
}

export function Week52Table({ stocks, type }: Week52TableProps) {
  const Icon = type === 'high' ? TrendingUp : TrendingDown;
  const colorClass = type === 'high' ? 'text-success' : 'text-danger';

  return (
    <div className="rounded-md border mt-4">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">종목</th>
            <th className="p-3 text-left font-medium">섹터</th>
            <th className="p-3 text-right font-medium">현재가</th>
            <th className="p-3 text-right font-medium">변동</th>
            <th className="p-3 text-right font-medium">거래량</th>
            <th className="p-3 text-right font-medium">시가총액</th>
            <th className="p-3 text-center font-medium">기간</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr 
              key={stock.symbol}
              className={`border-b last:border-b-0 hover:bg-accent transition-colors ${
                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              }`}
            >
              <td className="p-3">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <div>
                    <div className="font-semibold">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {stock.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-3">
                <span className="text-sm">{stock.sector}</span>
              </td>
              <td className="p-3 text-right font-semibold">
                ${formatNumber(stock.price)}
              </td>
              <td className={`p-3 text-right font-semibold ${
                stock.change > 0 ? 'text-success' : 'text-danger'
              }`}>
                <div>{formatPercent(stock.changePercent)}</div>
                <div className="text-xs">
                  ({stock.change > 0 ? '+' : ''}{formatNumber(stock.change)})
                </div>
              </td>
              <td className="p-3 text-right text-sm">
                {formatNumber(stock.volume)}M
              </td>
              <td className="p-3 text-right text-sm">
                ${formatNumber(stock.marketCap)}T
              </td>
              <td className="p-3 text-center">
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {type === 'high' 
                    ? (stock.daysAtHigh === 1 ? '오늘' : `${stock.daysAtHigh}일째`)
                    : (stock.daysAtLow === 1 ? '오늘' : `${stock.daysAtLow}일째`)
                  }
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


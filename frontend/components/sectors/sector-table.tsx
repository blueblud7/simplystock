"use client";

import { formatPercent } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface Sector {
  name: string;
  symbol: string;
  daily: number;
  weekly: number;
  monthly: number;
  ytd: number;
  description: string;
}

interface SectorTableProps {
  sectors: Sector[];
}

type SortKey = 'name' | 'daily' | 'weekly' | 'monthly' | 'ytd';

export function SectorTable({ sectors }: SectorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('daily');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedSectors = [...sectors].sort((a, b) => {
    const aVal = sortKey === 'name' ? a.name : a[sortKey];
    const bVal = sortKey === 'name' ? b.name : b[sortKey];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return sortOrder === 'asc' 
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const getCellColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 hover:text-primary"
              >
                <span>섹터</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="p-3 text-right font-medium">
              <button
                onClick={() => handleSort('daily')}
                className="flex items-center justify-end space-x-1 hover:text-primary ml-auto"
              >
                <span>일간</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="p-3 text-right font-medium">
              <button
                onClick={() => handleSort('weekly')}
                className="flex items-center justify-end space-x-1 hover:text-primary ml-auto"
              >
                <span>주간</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="p-3 text-right font-medium">
              <button
                onClick={() => handleSort('monthly')}
                className="flex items-center justify-end space-x-1 hover:text-primary ml-auto"
              >
                <span>월간</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="p-3 text-right font-medium">
              <button
                onClick={() => handleSort('ytd')}
                className="flex items-center justify-end space-x-1 hover:text-primary ml-auto"
              >
                <span>연초대비</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSectors.map((sector, index) => (
            <tr 
              key={sector.symbol}
              className={`border-b last:border-b-0 hover:bg-accent transition-colors ${
                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              }`}
            >
              <td className="p-3">
                <div>
                  <div className="font-semibold">{sector.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {sector.symbol}
                  </div>
                </div>
              </td>
              <td className={`p-3 text-right font-semibold ${getCellColor(sector.daily)}`}>
                {formatPercent(sector.daily)}
              </td>
              <td className={`p-3 text-right font-semibold ${getCellColor(sector.weekly)}`}>
                {formatPercent(sector.weekly)}
              </td>
              <td className={`p-3 text-right font-semibold ${getCellColor(sector.monthly)}`}>
                {formatPercent(sector.monthly)}
              </td>
              <td className={`p-3 text-right font-semibold ${getCellColor(sector.ytd)}`}>
                {formatPercent(sector.ytd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


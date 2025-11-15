"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  Globe, 
  Newspaper,
  Briefcase,
  FileText
} from "lucide-react";

const navigation = [
  { name: "대시보드", href: "/", icon: LayoutDashboard },
  { name: "섹터 분석", href: "/sectors", icon: PieChart },
  { name: "52주 신고가/신저가", href: "/52week", icon: TrendingUp },
  { name: "매크로 지표", href: "/macro", icon: Globe },
  { name: "뉴스", href: "/news", icon: Newspaper },
  { name: "증권사 리포트", href: "/reports", icon: FileText },
  { name: "포트폴리오", href: "/portfolio", icon: Briefcase },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">SimplyStock</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 모바일 메뉴는 추후 추가 */}
        </div>
      </div>
    </header>
  );
}


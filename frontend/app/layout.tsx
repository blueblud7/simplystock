import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MainNav } from "@/components/layout/main-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SimplyStock - 종합 주식 인사이트 플랫폼",
  description: "매일 업데이트되는 뉴스, 리포트, 매크로 지표를 기반으로 투자 인사이트를 제공합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <MainNav />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}


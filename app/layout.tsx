import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * 폰트 최적화
 * - Inter 폰트를 사용하여 성능 향상
 * - display: 'swap'로 FOIT(Flash of Invisible Text) 방지
 * - preload: true로 초기 로딩 속도 개선
 * - subsets: ['latin']으로 필요한 문자만 로드
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Toss Payments 결제 테스트",
  description: "Toss Payments 위젯을 사용한 샘플 결제 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

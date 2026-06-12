import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "속기사 맞춤법 학습기",
  description:
    "속기사를 위한 맞춤법·띄어쓰기·외래어 검사, 국어사전 검색, 단어장, 플래시카드 학습 도구",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

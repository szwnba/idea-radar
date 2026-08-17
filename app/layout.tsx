import type { Metadata } from 'next';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource-variable/noto-sans-sc';
import './globals.css';

export const metadata: Metadata = {
  title: '灵感雷达 · Idea Radar',
  description:
    '自动扫描 11 个灵感频道的信号站：Hacker News、GitHub、Product Hunt、阮一峰周刊、少数派……每 2 小时刷新，只看最热的想法。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

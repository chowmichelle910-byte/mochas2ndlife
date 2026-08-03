import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mocha健康紀錄",
  description: "紀錄貓咪每天的飲食、喝水、排尿與排便狀況",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "mocha健康紀錄",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-6 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Study Buddy - 双人学习陪伴空间',
  description: '温柔治愈的双人学习陪伴平台，一起学习，一起成长',
  manifest: '/manifest.json',
  themeColor: '#FFFAF5',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-white`}>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}

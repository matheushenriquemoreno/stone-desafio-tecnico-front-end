import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/toast'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  weight: ['600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Stone',
    template: '%s | Stone',
  },
  description: 'Autenticação e gestão de produtos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${barlowCondensed.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

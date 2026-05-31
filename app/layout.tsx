import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { NavBar } from '../components/ui/NavBar'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Job Pipeline',
  description: 'Automated job search pipeline for senior procurement roles in Canada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Suspense fallback={<div style={{ height: 49, borderBottom: '1px solid var(--border)' }} />}>
          <NavBar />
        </Suspense>
        <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
      </body>
    </html>
  )
}

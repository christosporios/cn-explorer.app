import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { lastRatingDateLimited } from './utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Community Notes Data Explorer',
  description: 'Explore the data from Twitter\'s Community Notes',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const lastContribution = await lastRatingDateLimited();
  const lastContributionDateStr = lastContribution.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <html lang="en">
      <body className="h-screen bg-white">
        <header className="flex justify-center items-start h-8 mb-8 border-b-slate-100 border-2 ">
          <h1 className="text-lg"><a href='/'>Community Notes Data Explorer</a></h1>
        </header>
        <main className="container mx-auto px-4 py-2">
        {children}
        </main>
        <footer className="text-xs text-center mt-8">
          <a href='https://twitter.com/i/communitynotes/download-data'>Data</a> includes contributions up until {lastContributionDateStr}.
        </footer>
      </body>
    </html>
  )
}

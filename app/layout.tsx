import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Chat',
  description: 'Simple AI chat application',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  )
}
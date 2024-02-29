// For the full copyright and license information, please view the LICENSE.txt file.

import type { Metadata } from 'next'
import { Providers } from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import '@/app/globals.css'

// Init vars
const vercelAnalyticsEnabled = process.env.VERCEL_ANALYTICS_ENABLED || false

export const metadata: Metadata = {
  title: 'Duel of the Paddles',
  description: 'Yet another pong game',
}

// RootLayout represents the root layout.
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metadata.title as string} />
        <meta property="og:description" content={metadata.description as string} />
        <meta property="og:image" content="https://www.duelofthepaddles.com/images/logo-1200x630.png" />
        <meta property="og:url" content="https://www.duelofthepaddles.com" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={metadata.title as string} />
        <meta property="twitter:description" content={metadata.description as string} />
        <meta property="twitter:image" content="https://www.duelofthepaddles.com/images/logo-1200x630.png" />

        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        {vercelAnalyticsEnabled &&
          <VercelAnalytics />
        }
        <Toaster toastOptions={{ duration: 10000 }} />
      </body>
    </html>
  )
}

// For the full copyright and license information, please view the LICENSE.txt file.

// Ref: https://nextui.org/docs/customization/dark-mode#add-next-themes-provider
//      https://github.com/pacocoursey/next-themes#with-app

'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from 'next-themes'

// Providers returns the providers for the app.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </ThemeProvider>
  )
}

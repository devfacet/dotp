import type { Config } from 'tailwindcss'
import { nextui } from '@nextui-org/react'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      dark: '#202020',
      light: '#E0E0E0'
    },
  },
  darkMode: 'class',
  plugins: [
    nextui()
  ],
  corePlugins: {
    preflight: true, // Ref: https://tailwindcss.com/docs/preflight
  },
}
export default config

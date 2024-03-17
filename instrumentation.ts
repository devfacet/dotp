// For the full copyright and license information, please view the LICENSE.txt file.

// Ref: https://template.nextjs.guide/app/building-your-application/optimizing/instrumentation

import { WSS } from '@/lib/wss'

// Init vars
const wsEnabled = process.env.WS_ENABLED || false

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Init webSocket server
    if (wsEnabled) {
      const wsPort = parseInt(process.env.WS_PORT || '3001')
      new WSS({ port: wsPort })
    }
  }
}

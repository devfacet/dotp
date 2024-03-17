// For the full copyright and license information, please view the LICENSE.txt file.

import GameComponent from '@/app/components/game'
import '@/app/page.css'

// Init vars
const wsEnabled = process.env.WS_ENABLED || false
const wsAddress = process.env.WS_ADDRESS || wsEnabled ? `ws://localhost:3001` : undefined

// Home returns the main component of the app.
export default function Home() {
  return (
    <main className="home">
      <GameComponent wsAddress={wsAddress} />
    </main>
  )
}

// For the full copyright and license information, please view the LICENSE.txt file.

import { Logger } from '@/lib/logger'
import { fileURLToPath } from 'url'
import { RawData, WebSocket, WebSocketServer } from 'ws'

// Init vars
const logger = Logger({ path: fileURLToPath(import.meta.url), sep: 'dotp' })

// WSSOptions represents the options to create a new websocket server.
interface WSSOptions {
  port: number
}

// WSS represents a websocket server.
export class WSS {
  private wss: WebSocketServer
  private clients: Set<WebSocket> = new Set()

  // constructor creates a new instance.
  constructor(options: WSSOptions) {
    const { port } = options

    this.wss = new WebSocketServer({ port })
    this.wss.on('connection', (ws: WebSocket) => {
      // Add client to the list
      this.clients.add(ws)

      // Remove client from the list
      ws.on('close', () => {
        this.clients.delete(ws)
      })

      ws.on('error', (e: Error) => {
        logger.error(`websocket error: ${e.message || e}`)
      })

      ws.on('message', (data: RawData) => {
        try {
          const msg: Msg = JSON.parse(data.toString())
          // console.debug('websocket message', msg) // for debug

          // Forward the message to all clients.
          this.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify(msg))
            }
          })
        } catch (e: any) {
          // For now ignore any unknown/invalid messages.
        }
      })
    })
    logger.info(`websocket server started on port ${port}`)
  }
}

// Msg represents a websocket message.
export type Msg = {
  event?: MsgEvent
  command?: MsgCommand
  move?: MsgMove
}

// MsgEvent represents an event field in a message.
type MsgEvent = 'start' | 'stop' | 'pause' | 'resume' | 'gameOver' | 'move' | 'collision'

// MsgCommand represents a command field in a message.
type MsgCommand = 'start' | 'stop' | 'pause' | 'resume' | 'move' | 'restart'

// MsgMove represents a move field in a message.
type MsgMove = {
  playerSide: 'dark' | 'light'
  up?: boolean
  down?: boolean
}

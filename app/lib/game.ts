// For the full copyright and license information, please view the LICENSE.txt file.

import { CollisionManager, BallToBoundaryCollision, BallToPaddleCollision, BallToGridCollision } from '@/lib/collision'
import { ControllerManager } from '@/lib/controller'
import { Grid } from '@/lib/grid'
import { Ball } from '@/lib/ball'
import { Paddle } from '@/lib/paddle'
import { randomNumber } from '@/lib/numbers'
import { Msg } from '@/lib/wss'
import { ulid } from 'ulidx'

// Side represents a side.
export type Side = 'dark' | 'light'

// PlayerSide represents a player side.
export type PlayerSide = 'dark' | 'light'

// PlayerAction represents a player action.
export type PlayerAction = '' | 'up' | 'down'

// GameState represents the game state.
export type GameState = 'initial' | 'running' | 'paused' | 'stopped' | 'over'

// GameOptions represents game options.
export interface GameOptions {
  canvasElement: HTMLCanvasElement
  gamepadEnabled?: boolean
  wsAddress?: string
  onNewGame?: (game: Game) => void
  onTogglePause?: (game: Game) => void
  onGameOver?: (game: Game) => void
}

// Game represents a game.
export class Game {
  static colorRed = '#EB212E'
  static colorBlue = '#2E67F8'
  static colorGreen = '#22BA1A'
  static colorDark = '#202020'
  static colorDarkSidePaddle = '#C8C8C8'
  static colorDarkSideBall = '#E0E0E0'
  static colorLight = '#E0E0E0'
  static colorLightSidePaddle = '#3A3A3A'
  static colorLightSideBall = '#202020'

  static ballSpeed = 300
  static paddleSpeed = 500
  static cellSize = 16

  private id: string
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gamepadEnabled: boolean
  private wsAddress?: string
  private ws?: WebSocket
  private onNewGame?: (game: Game) => void
  private onTogglePause?: (game: Game) => void
  private onGameOver?: (game: Game) => void
  private collisionManager: CollisionManager
  private controllerManager: ControllerManager

  private grid: Grid
  private paddles: Paddle[] = []
  private balls: Ball[] = []

  private gameState: GameState = 'initial'
  private winner?: PlayerSide
  private animationFrameId: number = -1
  private lastFrameSince: number = 0
  private lastFrameTime: number = 0

  // constructor creates a new instance.
  constructor(options: GameOptions) {
    const { canvasElement, gamepadEnabled, wsAddress, onNewGame, onTogglePause, onGameOver } = options

    this.id = ulid()
    this.canvas = canvasElement
    try {
      this.ctx = this.canvas.getContext('2d')!
    } catch (e: any) {
      throw new Error(`could not get 2D context: ${e.message || e}`)
    }
    this.gamepadEnabled = gamepadEnabled || false
    this.wsAddress = wsAddress
    if (onNewGame) this.onNewGame = onNewGame
    if (onTogglePause) this.onTogglePause = onTogglePause
    if (onGameOver) this.onGameOver = onGameOver

    // Initialize the main game components
    this.collisionManager = new CollisionManager({
      game: this,
      onBallToBoundaryCollision: this.onBallToBoundaryCollision,
      onBallToPaddleCollision: this.onBallToPaddleCollision,
      onBallToGridCollision: this.onBallToGridCollision,
    })
    this.controllerManager = new ControllerManager({ game: this, gamepadEnabled: this.gamepadEnabled, onNewGame: this.onNewGame, onTogglePause: this.onTogglePause })
    this.grid = new Grid({ game: this, width: this.canvas.width, height: this.canvas.height, cellSize: Game.cellSize })

    // Initialize the light paddle on the dark side against the light side
    this.paddles.push(new Paddle({
      game: this,
      playerSide: 'dark',
      x: Game.cellSize,
      y: this.canvas.height / 2 - 50,
      height: Game.cellSize * 5,
      speed: Game.paddleSpeed,
      color: Game.colorDarkSidePaddle,
    }))
    // Initialize the light ball at the dark player side and moving towards the light side
    this.balls.push(new Ball({
      game: this,
      playerSide: 'dark',
      x: this.canvas.width / 4,
      y: randomNumber(Game.cellSize, this.canvas.height - Game.cellSize),
      speedX: Game.ballSpeed,
      speedY: Math.random() < 0.5 ? Game.ballSpeed : -Game.ballSpeed,
      radius: Game.cellSize / 2,
      color: Game.colorDarkSideBall,
    }))

    // Initialize the dark paddle on the light side against the dark side
    this.paddles.push(new Paddle({
      game: this,
      playerSide: 'light',
      x: this.canvas.width - Game.cellSize * 2,
      y: this.canvas.height / 2 - 50,
      width: Game.cellSize,
      height: Game.cellSize * 5,
      speed: Game.paddleSpeed,
      color: Game.colorLightSidePaddle,
    }))
    // Initialize the dark ball at the light player side and moving towards the dark side
    this.balls.push(new Ball({
      game: this,
      playerSide: 'light',
      x: this.canvas.width / 4 * 3,
      y: randomNumber(Game.cellSize, this.canvas.height - Game.cellSize),
      speedX: -Game.ballSpeed,
      speedY: Math.random() < 0.5 ? Game.ballSpeed : -Game.ballSpeed,
      radius: Game.cellSize / 2,
      color: Game.colorLightSideBall,
    }))

    // Connect to the WebSocket server
    if (this.wsAddress) {
      try {
        this.ws = new WebSocket(this.wsAddress)
        this.ws.onopen = () => {
          console.debug(`websocket connection opened: ${this.wsAddress}`)
        }
        this.ws.onerror = (event: Event) => {
          console.error(`websocket error: ${event}`)
        }
        this.ws.onclose = (event: CloseEvent) => {
          console.debug(`websocket connection closed: ${event.code} ${event.reason}`)
        }
        this.ws.onmessage = (event: MessageEvent) => {
          try {
            let debug = false
            const msg: Msg = JSON.parse(event.data)
            switch (msg?.command) {
              case 'move':
                if (!msg.move?.playerSide) {
                  break
                }
                this.controllerManager.movePaddle(msg.move.playerSide, msg.move?.up || false, msg.move?.down || false)
                break
              case 'start':
                this.start()
                debug = true
                break
              case 'stop':
                this.stop()
                debug = true
                break
              case 'pause':
                this.pause()
                debug = true
                break
              case 'resume':
                this.resume()
                debug = true
                break
              case 'restart':
                this.stop()
                this.start()
                debug = true
                break
            }
            if (debug) console.debug(`websocket message: ${JSON.stringify(msg)}`)
          } catch (e: any) {
            // For now ignore any unknown/invalid messages.
          }
        }
      } catch (e: any) {
        console.error(`could not connect to WebSocket server: ${e.message || e}`)
      }
    }
  }

  // destroy destroys the game.
  public destroy(): void {
    this.stop()
    this.controllerManager.destroy()
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close()
    } else if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.ws.onopen = () => this.ws?.close()
    }
  }

  // getId returns the game id.
  public getId(): string {
    return this.id
  }

  // getGameState returns the game state.
  public getGameState(): GameState {
    return this.gameState
  }

  // getContext returns the canvas 2D context.
  public getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  // getGrid returns the grid.
  public getGrid(): Grid {
    return this.grid
  }

  // getController returns the controller manager.
  public getController(): ControllerManager {
    return this.controllerManager
  }

  // getPaddle returns the paddle for the given side.
  public getPaddle(side: PlayerSide): Paddle {
    for (const paddle of this.paddles) {
      if (paddle.getPlayerSide() === side) {
        return paddle
      }
    }
    throw new Error(`paddle not found: ${side}`)
  }

  // getSinceLastFrame returns the time since the last frame.
  public getSinceLastFrame(): number {
    return this.lastFrameSince
  }

  // getWinner returns the winner.
  public getWinner(): PlayerSide | undefined {
    return this.winner
  }

  // reset resets the game.
  private reset(): void {
    // Reset game state
    this.id = ulid()
    this.gameState = 'initial'
    this.winner = undefined

    // Reset game components
    this.collisionManager.reset()
    this.controllerManager.reset()
    this.grid.reset()
    for (const paddle of Object.values(this.paddles)) {
      paddle.reset()
    }
    for (const ball of this.balls) {
      ball.reset()
      ball.setY(randomNumber(Game.cellSize, this.canvas.height - Game.cellSize))
      ball.setSpeedY(Math.random() < 0.5 ? Game.ballSpeed : -Game.ballSpeed)
    }

    // Clear the canvas
    if (this.animationFrameId !== -1) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = -1
    }
    this.lastFrameSince = 0
    this.lastFrameTime = performance.now() // reset last frame time
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // splash shows the splash screen.
  public splash(): void {
    this.reset()
    this.draw()
    cancelAnimationFrame(requestAnimationFrame(this.gameLoop))
  }

  // start starts the game.
  public start(): void {
    if (this.gameState === 'running') return
    this.reset()
    this.gameState = 'running'

    this.wsSend('{"event": "start"}', true)

    requestAnimationFrame(this.gameLoop)
  }

  // stop stops the game.
  public stop(): void {
    if (this.gameState === 'stopped') return
    this.gameState = 'stopped'

    this.wsSend('{"event": "stop"}', true)

    cancelAnimationFrame(this.animationFrameId)
  }

  // pause pauses the game.
  public pause(): void {
    if (this.gameState === 'paused') return
    this.gameState = 'paused'

    this.wsSend('{"event": "pause"}', true)

    cancelAnimationFrame(this.animationFrameId)
  }

  // resume resumes the game.
  public resume(): void {
    if (this.gameState === 'running') return
    this.lastFrameTime = performance.now() // reset last frame time
    this.gameState = 'running'

    this.wsSend('{"event": "resume"}', true)

    requestAnimationFrame(this.gameLoop)
  }

  // togglePause toggles the game pause state.
  public togglePause(): void {
    if (this.gameState === 'running') {
      this.pause()
    } else if (this.gameState === 'paused') {
      this.resume()
    }
  }

  // gameOver ends the game.
  public gameOver(playerSide: PlayerSide): void {
    if (this.gameState === 'over') return
    this.gameState = 'over'
    this.winner = playerSide
    this.stop()

    this.wsSend(`{"event": "gameOver", "winner": "${playerSide}"}`, true)

    if (this.onGameOver) this.onGameOver(this)
  }

  // gameLoop is the game loop.
  private gameLoop = (time: number) => {
    if (this.gameState !== 'running') return

    // Calculate delta time since last frame in seconds
    this.lastFrameSince = (time - this.lastFrameTime) / 1000
    this.lastFrameTime = time

    this.update() // update the game state
    this.draw() // draw the next frame

    // Send the canvas pixels in base64
    this.wsSend(`{"event": "canvas", "data": "${this.canvas.toDataURL()}"}`, false)

    this.animationFrameId = requestAnimationFrame(this.gameLoop) // request next frame
  }

  // onBallToBoundaryCollision handles the ball to boundary collision.
  private onBallToBoundaryCollision = (collision: BallToBoundaryCollision): void => {
    this.wsSend(`{"event": "collision", "collision": {"kind": "ballToBoundary", "playerSide": "${collision.playerSide}", "oppositeSide": ${collision.oppositeSide || false}, "ownSide": ${collision.ownSide || false}}}`)
  }

  // onBallToPaddleCollision handles the ball to paddle collision.
  private onBallToPaddleCollision = (collision: BallToPaddleCollision): void => {
    this.wsSend(`{"event": "collision", "collision": {"kind": "ballToPaddle", "playerSide": "${collision.playerSide}", "paddlePlayerSide": "${collision.paddlePlayerSide}"}}`)
  }

  // onBallToGridCollision handles the ball to grid collision.
  private onBallToGridCollision = (collision: BallToGridCollision): void => {
    this.wsSend(`{"event": "collision", "collision": {"kind": "ballToGrid", "playerSide": "${collision.playerSide}"}}`)
  }

  // wsSend sends a message to the WebSocket server.
  public wsSend(msg: string, debug: boolean = false): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (debug) console.debug(`websocket send: ${msg}`)
      this.ws.send(msg)
    }
  }

  // update updates the game components.
  private update(): void {
    // Update controllers
    this.controllerManager.update()

    // Update paddles
    for (const paddle of this.paddles) {
      paddle.update()
    }

    // Handle collisions
    this.collisionManager.handleCollisions(this.balls, Object.values(this.paddles))

    // Update balls
    for (const ball of this.balls) {
      ball.update()
    }
  }

  // draw draws the game components.
  private draw(): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw the grid
    this.grid.draw()

    // Draw paddles
    for (const paddle of this.paddles) {
      paddle.draw()
    }

    // Draw balls
    for (const ball of this.balls) {
      ball.draw()
    }
  }
}

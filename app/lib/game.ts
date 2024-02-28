// For the full copyright and license information, please view the LICENSE.txt file.

import { CollisionManager } from '@/lib/collision'
import { ControllerManager } from '@/lib/controller'
import { Grid } from '@/lib/grid'
import { Ball } from '@/lib/ball'
import { Paddle } from '@/lib/paddle'
import { randomNumber } from '@/lib/numbers'
import { ulid } from 'ulidx'

// PlayerSide represents a player side.
export type PlayerSide = 'dark' | 'light'

// GameState represents the game state.
export type GameState = 'initial' | 'running' | 'paused' | 'stopped' | 'over'

// GameOptions represents game options.
export interface GameOptions {
  canvasElement: HTMLCanvasElement
  gamepadEnabled?: boolean
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
  static colorDarkPaddle = '#C8C8C8'
  static colorLight = '#E0E0E0'
  static colorLightPaddle = '#3A3A3A'

  static ballSpeed = 300
  static paddleSpeed = 500
  static cellSize = 16

  private id: string
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gamepadEnabled: boolean
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
    const { canvasElement, gamepadEnabled, onNewGame, onTogglePause, onGameOver } = options

    this.id = ulid()
    this.canvas = canvasElement
    try {
      this.ctx = this.canvas.getContext('2d')!
    } catch (e: any) {
      throw new Error(`could not get 2D context: ${e.message || e}`)
    }
    this.gamepadEnabled = gamepadEnabled || false
    if (onNewGame) this.onNewGame = onNewGame
    if (onTogglePause) this.onTogglePause = onTogglePause
    if (onGameOver) this.onGameOver = onGameOver

    // Initialize the main game components
    this.collisionManager = new CollisionManager({ game: this })
    this.controllerManager = new ControllerManager({ game: this, gamepadEnabled: this.gamepadEnabled, onNewGame: this.onNewGame, onTogglePause: this.onTogglePause })
    this.grid = new Grid({ game: this, width: this.canvas.width, height: this.canvas.height, cellSize: Game.cellSize })

    // Initialize the light paddle on the dark side against the light side
    // Light ball collides with the light grid cells, hence they are on the dark side.
    this.paddles.push(new Paddle({
      game: this,
      side: 'light',
      x: this.canvas.width - Game.cellSize * 2,
      y: this.canvas.height / 2 - 50,
      width: Game.cellSize,
      height: Game.cellSize * 5,
      speed: Game.paddleSpeed,
      color: Game.colorLightPaddle,
    }))
    // Initialize the light ball at the dark side and moving towards the light side
    this.balls.push(new Ball({
      game: this,
      side: 'light',
      x: this.canvas.width / 4,
      y: randomNumber(Game.cellSize, this.canvas.height - Game.cellSize),
      speedX: Game.ballSpeed,
      speedY: Game.ballSpeed,
      radius: Game.cellSize / 2,
      color: Game.colorLight,
    }))

    // Initialize the dark paddle on the light side against the dark side
    // Dark ball collides with the dark grid cells, hence they are on the light side.
    this.paddles.push(new Paddle({
      game: this,
      side: 'dark',
      x: Game.cellSize,
      y: this.canvas.height / 2 - 50,
      height: Game.cellSize * 5,
      speed: Game.paddleSpeed,
      color: Game.colorDarkPaddle,
    }))
    // Initialize the dark ball at the light side and moving towards the dark side
    this.balls.push(new Ball({
      game: this,
      side: 'dark',
      x: this.canvas.width / 4 * 3,
      y: randomNumber(Game.cellSize, this.canvas.height - Game.cellSize),
      speedX: -Game.ballSpeed,
      speedY: -Game.ballSpeed,
      radius: Game.cellSize / 2,
      color: Game.colorDark,
    }))
  }

  // destroy destroys the game.
  public destroy(): void {
    this.stop()
    this.controllerManager.destroy()
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
    requestAnimationFrame(this.gameLoop)
  }

  // stop stops the game.
  public stop(): void {
    if (this.gameState === 'stopped') return
    this.gameState = 'stopped'
    cancelAnimationFrame(this.animationFrameId)
  }

  // pause pauses the game.
  public pause(): void {
    if (this.gameState === 'paused') return
    this.gameState = 'paused'
    cancelAnimationFrame(this.animationFrameId)
  }

  // resume resumes the game.
  public resume(): void {
    if (this.gameState === 'running') return
    this.lastFrameTime = performance.now() // reset last frame time
    this.gameState = 'running'
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
    this.animationFrameId = requestAnimationFrame(this.gameLoop) // request next frame
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

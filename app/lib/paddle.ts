// For the full copyright and license information, please view the LICENSE.txt file.

import { Game, PlayerSide } from '@/lib/game'

// PaddleOptions represents the options to create a new paddle.
export interface PaddleOptions {
  game: Game
  side: PlayerSide
  x: number
  y: number
  height?: number
  width?: number
  speed?: number
  color?: string | CanvasGradient | CanvasPattern
}

// Paddle represents a paddle.
export class Paddle {
  static height = 80
  static width = 16
  static speed = 500
  static color = '#FFFFFF'

  private options: PaddleOptions
  private game: Game
  private side: PlayerSide
  private x: number
  private y: number
  private height: number = Paddle.height
  private width: number = Paddle.width
  private speed: number = Paddle.speed
  private color: string | CanvasGradient | CanvasPattern = Paddle.color

  private moveUp: boolean = false
  private moveDown: boolean = false

  // constructor creates a new instance.
  constructor(options: PaddleOptions) {
    const { game, side, x, y, height, width, speed, color } = options

    this.options = options
    this.game = game
    this.side = side
    this.x = x
    this.y = y
    if (height !== undefined) this.height = height
    if (width !== undefined) this.width = width
    if (speed !== undefined) this.speed = speed
    if (color !== undefined) this.color = color
  }

  // reset resets the paddle to its initial state.
  public reset(): void {
    this.x = this.options.x
    this.y = this.options.y
    this.height = this.options.height || Paddle.height
    this.width = this.options.width || Paddle.width
    this.speed = this.options.speed || Paddle.speed
    this.color = this.options.color || Paddle.color
  }

  // getX returns the x position of the paddle.
  public getX(): number {
    return this.x
  }

  // setX sets the x position of the paddle.
  public setX(x: number): void {
    this.x = x
  }

  // getY returns the y position of the paddle.
  public getY(): number {
    return this.y
  }

  // setY sets the y position of the paddle.
  public setY(y: number): void {
    this.y = y
  }

  // getHeight returns the height of the paddle.
  public getHeight(): number {
    return this.height
  }

  // getWidth returns the width of the paddle.
  public getWidth(): number {
    return this.width
  }

  // getPlayerSide returns the player side of the paddle.
  public getPlayerSide(): PlayerSide {
    return this.side
  }

  // setSpeed sets the speed of the paddle.
  public setSpeed(speed: number): void {
    this.speed = speed
  }

  // setColor sets the color of the paddle.
  public setColor(color: string | CanvasGradient | CanvasPattern): void {
    this.color = color
  }

  // setMovement sets the movement state of the paddle.
  public setMovement(up: boolean, down: boolean): void {
    this.moveUp = up
    this.moveDown = down
  }

  // draw draws the paddle on the canvas.
  public draw(): void {
    this.game.getContext().fillStyle = this.color
    this.game.getContext().fillRect(this.x, this.y, this.width, this.height)
  }

  // update updates the paddle position.
  public update(): void {
    // Update position
    if (this.moveUp) this.y -= this.speed * this.game.getSinceLastFrame()
    if (this.moveDown) this.y += this.speed * this.game.getSinceLastFrame()

    // Prevent paddles from going off screen
    // this.y = Math.max(this.y, 0) // top
    // this.y = Math.min(this.y, this.ctx.canvas.height - this.height) // bottom

    // Allow paddles to go off screen 90% so paddles can hit ball on edge
    const offScreenLimit = this.height * 0.9
    this.y = Math.max(this.y, -offScreenLimit) // top
    this.y = Math.min(this.y, this.game.getContext().canvas.height - this.height + offScreenLimit) // bottom
  }
}

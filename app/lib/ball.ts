// For the full copyright and license information, please view the LICENSE.txt file.

import { Game, PlayerSide } from '@/lib/game'

// BallOptions represents the options to create a new ball.
export interface BallOptions {
  game: Game
  side: PlayerSide
  x: number
  y: number
  speedX: number
  speedY: number
  radius?: number
  color?: string | CanvasGradient | CanvasPattern
}

// Ball represents a ball.
export class Ball {
  static radius = 8
  static color = '#FFFFFF'

  private options: BallOptions
  private game: Game
  private side: PlayerSide
  private x: number
  private y: number
  private speedX: number
  private speedY: number
  private radius: number = Ball.radius
  private color: string | CanvasGradient | CanvasPattern = Ball.color

  // constructor creates a new instance.
  constructor(options: BallOptions) {
    const { game, side, x, y, speedX, speedY, radius, color } = options

    this.options = options
    this.game = game
    this.side = side
    this.x = x
    this.y = y
    this.speedX = speedX
    this.speedY = speedY
    if (radius !== undefined) this.radius = radius
    if (color !== undefined) this.color = color
  }

  // reset resets the ball to its initial state.
  public reset(): void {
    this.x = this.options.x
    this.y = this.options.y
    this.speedX = this.options.speedX
    this.speedY = this.options.speedY
    this.radius = this.options.radius || Ball.radius
    this.color = this.options.color || Ball.color
  }

  // getX returns the x position of the ball.
  public getX(): number {
    return this.x
  }

  // getY returns the y position of the ball.
  public getY(): number {
    return this.y
  }

  // getRadius returns the radius of the ball.
  public getRadius(): number {
    return this.radius
  }

  // getSpeedX returns the speed of the ball in the x direction.
  public getSpeedX(): number {
    return this.speedX
  }

  // getSpeedY returns the speed of the ball in the y direction.
  public getSpeedY(): number {
    return this.speedY
  }

  // getPlayerSide returns the player side of the paddle.
  public getPlayerSide(): PlayerSide {
    return this.side
  }

  // setX sets the x position of the ball.
  public setX(x: number): void {
    this.x = x
  }

  // setY sets the y position of the ball.
  public setY(y: number): void {
    this.y = y
  }

  // setXY sets the x and y position of the ball.
  public setXY(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  // setSpeedX sets the speed of the ball in the x direction.
  public setSpeedX(speedX: number): void {
    this.speedX = speedX
  }

  // setSpeedY sets the speed of the ball in the y direction.
  public setSpeedY(speedY: number): void {
    this.speedY = speedY
  }

  // setSpeed sets the speed of the ball.
  public setSpeed(speedX: number, speedY: number) {
    this.speedX = speedX
    this.speedY = speedY
  }

  // setColor sets the color of the ball.
  public setColor(color: string | CanvasGradient | CanvasPattern): void {
    this.color = color
  }

  // draw draws the ball on the canvas.
  public draw(): void {
    this.game.getContext().beginPath()
    this.game.getContext().arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    this.game.getContext().fillStyle = this.color
    this.game.getContext().fill()
    this.game.getContext().closePath()
  }

  // update updates the ball position.
  public update(): void {
    // Update position
    this.x = this.x + this.speedX * this.game.getSinceLastFrame()
    this.y = this.y + this.speedY * this.game.getSinceLastFrame()
  }
}

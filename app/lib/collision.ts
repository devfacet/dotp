// For the full copyright and license information, please view the LICENSE.txt file.

import { Game } from '@/lib/game'
import { Ball } from '@/lib/ball'
import { Paddle } from '@/lib/paddle'

// CollisionManagerOptions represents the options to create a new collision manager.
export interface CollisionManagerOptions {
  game: Game
}

// CollisionManager manages collisions between game components.
export class CollisionManager {
  private options: CollisionManagerOptions
  private game: Game

  // constructor creates a new instance.
  constructor(options: CollisionManagerOptions) {
    const { game } = options

    this.options = options
    this.game = game
  }

  // reset resets the collision manager.
  public reset(): void {
    // Nothing to do here
  }

  // handleCollisions handles collisions between game components.
  public handleCollisions(balls: Ball[], paddles: Paddle[]): void {
    // Iterate over the balls
    for (let i = 0, l = balls.length; i < l; i++) {
      const ball = balls[i]
      const ballFutureX = ball.getX() + ball.getSpeedX() * this.game.getSinceLastFrame()
      const ballFutureY = ball.getY() + ball.getSpeedY() * this.game.getSinceLastFrame()

      // Check for collision between the ball and boundaries
      const b2b = this.checkBallToBoundaryCollision(ball, ballFutureX, ballFutureY)
      if (b2b.collided) {
        if (b2b.oppositeSide) {
          // Note that we launch light ball at the dark side and dark ball at the light side,
          // so that balls can collide with the opposite side boundary.
          // Hence we reverse the player side here.
          this.game.gameOver(ball.getPlayerSide() === 'dark' ? 'light' : 'dark')
          return
        }
        if (b2b.speedX) ball.setSpeedX(b2b.speedX)
        if (b2b.speedY) ball.setSpeedY(b2b.speedY)
        if (b2b.futureX) ball.setX(b2b.futureX)
        if (b2b.futureY) ball.setY(b2b.futureY)
      }

      // Check for collisions between the ball and paddles
      for (let j = 0, m = paddles.length; j < m; j++) {
        const b2p = this.checkBallToPaddleCollision(ball, paddles[j], ballFutureX, ballFutureY)
        if (b2p.collided) {
          if (b2p.speedX) ball.setSpeedX(b2p.speedX)
          if (b2p.speedY) ball.setSpeedY(b2p.speedY)
          if (b2p.futureX) ball.setX(b2p.futureX)
          if (b2p.futureY) ball.setY(b2p.futureY)
        }
      }

      // Check for collisions between balls
      for (let j = 0, m = balls.length; j < m; j++) {
        if (i === j) {
          continue
        }
        const ballB = balls[j]
        const b2b = this.checkBallToBallCollision(ball, ballB, ballFutureX, ballFutureY)
        if (b2b.collided) {
          if (b2b.ballASpeedX) ball.setSpeedX(b2b.ballASpeedX)
          if (b2b.ballASpeedY) ball.setSpeedY(b2b.ballASpeedY)
          if (b2b.ballBSpeedX) ballB.setSpeedX(b2b.ballBSpeedX)
          if (b2b.ballBSpeedY) ballB.setSpeedY(b2b.ballBSpeedY)
        }
      }

      // Check for collisions between the balls and the grid
      const b2g = this.checkBallToGridCollision(ball, ballFutureX, ballFutureY)
      if (b2g.collided) {
        if (b2g.speedX) ball.setSpeedX(b2g.speedX)
        if (b2g.speedY) ball.setSpeedY(b2g.speedY)
        if (b2g.futureX) ball.setX(b2g.futureX)
        if (b2g.futureY) ball.setY(b2g.futureY)
        if (b2g.cells) {
          for (let k = 0, n = b2g.cells.length; k < n; k++) {
            const cell = b2g.cells[k]
            this.game.getGrid().setCell(cell[0], cell[1], ball.getPlayerSide() === 'dark' ? 'light' : 'dark')
          }
        }
      }
    }
  }

  // checkBallToBoundaryCollision checks if a ball collides with a boundary.
  private checkBallToBoundaryCollision(ball: Ball, futureX?: number, futureY?: number): BallToBoundaryCollision {
    const collision: BallToBoundaryCollision = { collided: false }
    const ballX = futureX || ball.getX()
    const ballY = futureY || ball.getY()
    const radius = ball.getRadius()
    const canvasWidth = this.game.getContext().canvas.width
    const canvasHeight = this.game.getContext().canvas.height

    // Check for collision with the left and right boundaries
    if (ballX - radius <= 0) {
      collision.collided = true
      collision.speedX = -ball.getSpeedX()
      collision.futureX = radius // for avoiding sticking

      // Check if the ball is on the opposite side of the boundary
      if (ball.getPlayerSide() === 'dark') {
        collision.oppositeSide = true
      }
    } else if (ballX + radius >= canvasWidth) {
      collision.collided = true
      collision.speedX = -ball.getSpeedX()
      collision.futureX = canvasWidth - radius // for avoiding sticking

      // Check if the ball is on the opposite side of the boundary
      if (ball.getPlayerSide() === 'light') {
        collision.oppositeSide = true
      }
    }

    // Check for collision with the top and bottom boundaries
    if (ballY - radius <= 0) {
      collision.collided = true
      collision.speedY = -ball.getSpeedY()
      collision.futureY = radius // for avoiding sticking
    } else if (ballY + radius >= canvasHeight) {
      collision.collided = true
      collision.speedY = -ball.getSpeedY()
      collision.futureY = canvasHeight - radius // for avoiding sticking
    }

    return collision
  }

  // checkBallToPaddleCollision checks if a ball collides with a paddle.
  public checkBallToPaddleCollision(ball: Ball, paddle: Paddle, futureX?: number, futureY?: number): BallToPaddleCollision {
    const collision: BallToPaddleCollision = { collided: false }
    const ballX = futureX || ball.getX()
    const ballY = futureY || ball.getY()

    // Calculate the distance from the center of the paddle to the ball position in both x and y axes
    const distX = Math.abs(ballX - paddle.getX() - paddle.getWidth() / 2)
    const distY = Math.abs(ballY - paddle.getY() - paddle.getHeight() / 2)

    if (distX > paddle.getWidth() / 2 + ball.getRadius()) {
      // If the horizontal distance is greater than half the paddle's width plus the ball's radius, no collision on X
      return collision
    } else if (distY > paddle.getHeight() / 2 + ball.getRadius()) {
      // If the vertical distance is greater than half the paddle's height plus the ball's radius, no collision on Y
      return collision
    }

    if (distX <= paddle.getWidth() / 2) {
      // If the ball is within the horizontal bounds of the paddle, it's a collision
      collision.collided = true
    } else if (distY <= paddle.getHeight() / 2) {
      // If the ball is within the vertical bounds of the paddle, it's a collision
      collision.collided = true
    } else {
      // If the distance to the corner is less than the radius of the ball, it's a collision
      const dx = distX - paddle.getWidth() / 2
      const dy = distY - paddle.getHeight() / 2
      if (dx * dx + dy * dy <= ball.getRadius() * ball.getRadius()) {
        collision.collided = true
      }
    }
    if (!collision.collided) {
      return collision
    }

    // Calculate the angle of the collision
    let collidePoint = ball.getY() - (paddle.getY() + paddle.getHeight() / 2)
    collidePoint = collidePoint / (paddle.getHeight() / 2)
    // Convert the angle to radians
    const angleRad = (Math.PI / 3) * collidePoint
    // Calculate the magnitude of the current velocity
    const magnitude = Math.sqrt(ball.getSpeedX() * ball.getSpeedX() + ball.getSpeedY() * ball.getSpeedY())

    // Determine the ball's speed and direction
    switch (paddle.getPlayerSide()) {
      case 'dark':
        collision.speedX = magnitude * Math.cos(angleRad)
        collision.speedY = magnitude * Math.sin(angleRad)
        futureX = paddle.getX() + paddle.getWidth() + ball.getRadius()
        break
      case 'light':
        collision.speedX = -magnitude * Math.cos(angleRad)
        collision.speedY = magnitude * Math.sin(angleRad)
        futureX = paddle.getX() - ball.getRadius()
        break
    }

    return collision
  }

  // checkBallToBallCollision checks if a ball collides with another ball.
  public checkBallToBallCollision(ballA: Ball, ballB: Ball, futureX?: number, futureY?: number): BallToBallCollision {
    const collision: BallToBallCollision = { collided: false }
    const ballAX = futureX || ballA.getX()
    const ballAY = futureY || ballA.getY()

    // Calculate the distance between the two balls
    const dx = ballAX - ballB.getX()
    const dy = ballAY - ballB.getY()
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if the balls are colliding
    if (distance < ballA.getRadius() + ballB.getRadius()) {
      collision.collided = true
      collision.ballASpeedX = -ballA.getSpeedX()
      collision.ballASpeedY = -ballA.getSpeedY()
      collision.ballBSpeedX = -ballB.getSpeedX()
      collision.ballBSpeedY = -ballB.getSpeedY()
    }

    return collision
  }

  // checkBallToGridCollision checks if a ball collides with a grid cell.
  public checkBallToGridCollision(ball: Ball, futureX?: number, futureY?: number): BallToGridCollision {
    const collision: BallToGridCollision = { collided: false }
    const ballX = futureX || ball.getX()
    const ballY = futureY || ball.getY()

    // Determine current grid cell position
    const cellSize = ball.getRadius() * 2
    const gridX = Math.floor(ballX / cellSize)
    const gridY = Math.floor(ballY / cellSize)

    // Check if the ball is within the grid bounds
    if (gridY >= 0 && gridY < this.game.getGrid().getRowLength() && gridX >= 0 && gridX < this.game.getGrid().getColLength()) {
      const cellPlayerSide = this.game.getGrid().getCell(gridX, gridY)

      // Check for collision with a cell of the same player side
      if (cellPlayerSide === ball.getPlayerSide()) {
        collision.collided = true
        collision.speedX = -ball.getSpeedX()
        collision.speedY = -ball.getSpeedY()
        collision.futureX = ballX - ball.getSpeedX() * this.game.getSinceLastFrame()
        collision.futureY = ballY - ball.getSpeedY() * this.game.getSinceLastFrame()
        if (!collision.cells) collision.cells = []
        collision.cells.push([gridX, gridY])
      }
    }

    return collision
  }

}

// BallToBoundaryCollision represents a collision between a ball and a boundary.
type BallToBoundaryCollision = {
  collided: boolean
  speedX?: number
  speedY?: number
  futureX?: number
  futureY?: number
  oppositeSide?: boolean
}

// BallToPaddleCollision represents a collision between a ball and a paddle.
type BallToPaddleCollision = {
  collided: boolean
  speedX?: number
  speedY?: number
  futureX?: number
  futureY?: number
}

// BallToBallCollision represents a collision between two balls.
type BallToBallCollision = {
  collided: boolean
  ballASpeedX?: number
  ballASpeedY?: number
  ballBSpeedX?: number
  ballBSpeedY?: number
}

// BallToGridCollision represents a collision between a ball and a grid cell.
type BallToGridCollision = {
  collided: boolean
  speedX?: number
  speedY?: number
  futureX?: number
  futureY?: number
  cells?: number[][]
}

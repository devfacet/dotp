// For the full copyright and license information, please view the LICENSE.txt file.

import { Game } from '@/lib/game'

// GridOptions represents the options to create a new grid.
export interface GridOptions {
  game: Game
  width: number
  height: number
  cellSize?: number
}

// Grid represents a grid.
export class Grid {
  static cellSize = 16

  private options: GridOptions
  private game: Game
  private width: number
  private height: number
  private cellSize: number = Grid.cellSize
  private grid: string[][]
  private showDebugGrid: boolean = false

  // constructor creates a new instance.
  constructor(options: GridOptions) {
    const { game, width, height, cellSize } = options

    this.options = options
    this.game = game
    this.width = width
    this.height = height
    if (cellSize !== undefined) this.cellSize = cellSize
    this.grid = []

    this.initGrid()
  }

  // reset resets the grid.
  public reset(): void {
    this.width = this.options.width
    this.height = this.options.height
    this.cellSize = this.options.cellSize || Grid.cellSize
    this.initGrid()
  }

  // initGrid initializes the grid.
  private initGrid(): void {
    // Initialize grid with half dark and half light colors
    const numOfGridRows = Math.ceil(this.height / this.cellSize)
    const numOfGridCols = Math.ceil(this.width / this.cellSize)
    this.grid = new Array(numOfGridRows).fill(null).map(() => new Array(numOfGridCols).fill('light'))
    // Set the left half of the grid to dark
    const numOfMidCols = Math.floor(numOfGridCols / 2)
    for (let row = 0; row < numOfGridRows; row++) {
      for (let col = 0; col < numOfMidCols; col++) {
        this.grid[row][col] = 'dark'
      }
    }
  }

  // getGrid returns the grid.
  public getGrid(): string[][] {
    return this.grid
  }

  // getRowLength returns the length of the rows.
  public getRowLength(): number {
    return this.grid.length
  }

  // getColLength returns the length of the columns.
  public getColLength(): number {
    return this.grid[0].length
  }

  // toggleDebugGrid toggles the debug grid.
  public toggleDebugGrid(): void {
    this.showDebugGrid = !this.showDebugGrid
  }

  // setCell sets the cell at the given position.
  // x (horizontal) represents the column
  // y (vertical) represents the row
  public setCell(x: number, y: number, value: string): void {
    this.grid[y][x] = value
  }

  // getCell returns the cell at the given position.
  // x (horizontal) represents the column
  // y (vertical) represents the row
  public getCell(x: number, y: number): string {
    return this.grid[y][x]
  }

  // draw draws the grid on the canvas.
  public draw(): void {
    // Draw the grid
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        this.game.getContext().fillStyle = this.grid[x][y] === 'dark' ? Game.colorDark : Game.colorLight
        this.game.getContext().fillRect(y * Game.cellSize, x * Game.cellSize, Game.cellSize, Game.cellSize)
      }
    }

    // Draw the grid lines for debugging
    if (this.showDebugGrid) {
      this.game.getContext().strokeStyle = '#FF0000'
      this.game.getContext().lineWidth = 0.1
      for (let x = 0; x < this.width; x += Game.cellSize) {
        for (let y = 0; y < this.height; y += Game.cellSize) {
          this.game.getContext().strokeRect(x, y, Game.cellSize, Game.cellSize)
        }
      }
    }
  }
}

// For the full copyright and license information, please view the LICENSE.txt file.

import { Game, GameState, PlayerAction, PlayerSide } from '@/app/lib/game'

// GameServiceOptions represents game service options.
export interface GameServiceOptions {
  canvasElement: HTMLCanvasElement
  gamepadEnabled?: boolean
  wsAddress?: string
  onNewGame?: (game: Game) => void
  onTogglePause?: (game: Game) => void
  onGameOver?: (game: Game) => void
}

// GameService represents a game service.
export class GameService {
  private canvas?: HTMLCanvasElement
  private game?: Game
  private gamepadEnabled: boolean
  private wsAddress?: string
  private onGameOver?: (game: Game) => void
  private onNewGame?: (game: Game) => void
  private onTogglePause?: (game: Game) => void

  // constructor creates a new instance.
  constructor(options: GameServiceOptions) {
    const { canvasElement, gamepadEnabled, wsAddress, onNewGame, onTogglePause, onGameOver } = options

    this.canvas = canvasElement
    this.gamepadEnabled = gamepadEnabled || false
    this.wsAddress = wsAddress
    if (onNewGame) this.onNewGame = onNewGame
    if (onTogglePause) this.onTogglePause = onTogglePause
    if (onGameOver) this.onGameOver = onGameOver

    this.game = new Game({
      canvasElement: this.canvas,
      gamepadEnabled: this.gamepadEnabled,
      wsAddress: this.wsAddress,
      onNewGame: this.onNewGame,
      onTogglePause: this.onTogglePause,
      onGameOver: this.onGameOver,
    })
  }

  // getGameState returns the game state.
  public getGameState(): GameState {
    console.debug('GameService.getGameState')
    if (!this.game) return 'initial'
    return this.game.getGameState()
  }

  // start starts the game.
  public start(): void {
    console.debug('GameService.start')
    if (!this.game) return
    this.game.start()
  }

  // stop stops the game.
  public stop(): void {
    console.debug('GameService.stop')
    if (!this.game) return
    this.game.stop()
  }

  // pause pauses the game.
  public pause(): void {
    console.debug('GameService.pause')
    if (!this.game) return
    this.game.pause()
  }

  // resume resumes the game.
  public resume(): void {
    console.debug('GameService.resume')
    if (!this.game) return
    this.game.resume()
  }

  // destroy destroys the game.
  public destroy(): void {
    console.debug('GameService.destroy')
    if (!this.game) return
    this.game.destroy()
    this.canvas = undefined
    this.game = undefined
  }

  // splash shows the splash screen.
  public splash(): void {
    console.debug('GameService.splash')
    if (!this.game) return
    this.game.splash()
  }

  // handleMouseEventByElementId handles a mouse event by element id.
  public handleMouseEventByElementId(elementId: string, playerSide: PlayerSide, action: PlayerAction): void {
    this.game?.getController().handleMouseEventByElementId(elementId, playerSide, action)
  }
}

// For the full copyright and license information, please view the LICENSE.txt file.

// TODO: Implement Controller interface for keyboard and mouse controllers.

import { Game, PlayerSide } from '@/lib/game'
import { Paddle } from '@/lib/paddle'

// ControllerManagerOptions represents the options for the controller manager.
export type ControllerManagerOptions = {
  game: Game
  gamepadEnabled?: boolean
  onNewGame?: (game: Game) => void
  onTogglePause?: (game: Game) => void
  onControllerConnected?: (game: Game, controller: Controller) => void
  onControllerDisconnected?: (game: Game, controller: Controller) => void
}

// ControllerManager represents a controller manager.
export class ControllerManager {
  private options: ControllerManagerOptions
  private game: Game
  private eventListeners: Array<{ element: EventTarget, eventType: string, listener: EventListenerOrEventListenerObject }> = []
  private keysPressed: Set<string> = new Set()
  private gamepadEnabled: boolean
  private controllers: Map<string, Controller> = new Map()
  private controllersInterval: NodeJS.Timeout | undefined
  private onNewGame?: (game: Game) => void
  private onTogglePause?: (game: Game) => void
  private onControllerConnected?: (game: Game, controller: Controller) => void
  private onControllerDisconnected?: (game: Game, controller: Controller) => void

  // constructor creates a new instance.
  constructor(options: ControllerManagerOptions) {
    const { game, gamepadEnabled, onNewGame, onTogglePause, onControllerConnected, onControllerDisconnected } = options

    this.options = options
    this.game = game
    this.gamepadEnabled = gamepadEnabled || false
    this.onNewGame = onNewGame
    this.onTogglePause = onTogglePause
    this.onControllerConnected = onControllerConnected
    this.onControllerDisconnected = onControllerDisconnected

    // Add event listeners
    this.eventListeners.push({ element: document, eventType: 'keydown', listener: this.handleKeyDown.bind(this) })
    this.eventListeners.push({ element: document, eventType: 'keyup', listener: this.handleKeyUp.bind(this) })
    if (this.gamepadEnabled) {
      this.eventListeners.push({ element: window, eventType: 'gamepadconnected', listener: this.handleGamepadConnected.bind(this) })
      this.eventListeners.push({ element: window, eventType: 'gamepaddisconnected', listener: this.handleGamepadDisconnected.bind(this) })
    }
    this.eventListeners.forEach(({ element, eventType, listener }) => {
      element.addEventListener(eventType, listener)
    })
  }

  // destroy destroys the controller manager.
  public destroy(): void {
    if (this.controllersInterval) clearInterval(this.controllersInterval)
    this.controllersInterval = undefined
    this.controllers.clear()
    this.keysPressed.clear()

    // Remove all event listeners
    this.eventListeners.forEach(({ element, eventType, listener }) => {
      element.removeEventListener(eventType, listener)
    })
    this.eventListeners = []
  }

  // reset resets the controller manager.
  public reset(): void {
    this.keysPressed.clear()
  }

  // update updates the controller manager.
  public update(): void {
    // Check gamepads
    if (this.gamepadEnabled) {
      for (const controller of this.controllers.values()) {
        if (controller.type === 'gamepad' && controller.getPlayerSide() !== undefined) {
          const { gamepad, state, isUpdated, side } = (controller as GameController).getGamepad()
          if (state !== 'connected' || !isUpdated || !side ) return
          const [,,,,,,,, pause] = gamepad.buttons
          if (pause.pressed) {
            this.togglePause()
            return
          }
          const paddle = this.game.getPaddle(side)
          const [, ly, , ry] = gamepad.axes
          paddle.setMovement(ry < -0.2 || ly < -0.2, ry > 0.2 || ly > 0.2)
        }
      }
    }
  }

  // newGame starts a new game.
  private newGame(): void {
    this.game.stop()
    this.game.start()
    if (this.onNewGame) this.onNewGame(this.game)
  }

  // togglePause toggles the pause state.
  private togglePause(): void {
    this.game.togglePause()
    if (this.onTogglePause) this.onTogglePause(this.game)
  }

  // getControllerByGamepad returns a controller by gamepad.
  private getControllerByGamepad(gamepad: Gamepad): Controller | undefined {
    return this.controllers.get('g' + gamepad.index)
  }

  // setPaddleMovement sets the paddle movement based on the keys pressed.
  private setPaddleMovement() {
    // Update paddles
    this.game.getPaddle('dark').setMovement(this.keysPressed.has('w'), this.keysPressed.has('s'))
    this.game.getPaddle('light').setMovement(this.keysPressed.has('o'), this.keysPressed.has('l'))
  }

  // startContinuousMovement starts continuous movement for a paddle.
  private startContinuousMovement(key: string, paddle: Paddle): void {
    if (paddle.getPlayerSide() === 'dark'){
      this.game.getPaddle('dark').setMovement(key === 'w', key === 's')
    } else {
      this.game.getPaddle('light').setMovement(key === 'o', key === 'l')
    }
  }

  // stopContinuousMovement stops continuous movement for a paddle.
  private stopContinuousMovement(key: string, paddle: Paddle): void {
    if (paddle.getPlayerSide() === 'dark'){
      this.game.getPaddle('dark').setMovement(false, false)
    } else {
      this.game.getPaddle('light').setMovement(false, false)
    }
  }

  // handleKeyDown handles key down events.
  private handleKeyDown = (e: Event) => {
    const event = e as KeyboardEvent
    const key = event.key.toLowerCase()
    switch (key) {
      case 'n':
        this.newGame()
        break
      case 'p':
        this.togglePause()
        break
      case 'g':
        this.game.getGrid().toggleDebugGrid()
        break
    }

    this.keysPressed.add(key)
    this.setPaddleMovement()
  }

  // handleKeyUp handles key up events.
  private handleKeyUp = (event: Event) => {
    const keyboardEvent = event as KeyboardEvent
    this.keysPressed.delete(keyboardEvent.key.toLowerCase())
    this.setPaddleMovement()
  }

  // handleMouseEvent handles mouse events.
  public handleMouseEvent(elementId: string, key: string, paddle: Paddle): void {
    const element = document.getElementById(elementId)
    if (!element) return

    // Initialize event listeners
    const mouseDownListener = () => this.startContinuousMovement(key, paddle)
    const mouseUpListener = () => this.stopContinuousMovement(key, paddle)
    const mouseLeaveListener = () => this.stopContinuousMovement(key, paddle)
    const touchStartListener = (e: Event) => {
      if (e.cancelable) {
        // Prevent scrolling and ensure touch is used for control
        e.preventDefault()
      }
      this.startContinuousMovement(key, paddle)
    }
    const touchEndListener = () => {
      this.stopContinuousMovement(key, paddle)
    }

    // Add event listeners
    element.addEventListener('mousedown', mouseDownListener)
    this.eventListeners.push({ element, eventType: 'mousedown', listener: mouseDownListener })
    element.addEventListener('mouseup', mouseUpListener)
    this.eventListeners.push({ element, eventType: 'mouseup', listener: mouseUpListener })
    element.addEventListener('mouseleave', mouseLeaveListener)
    this.eventListeners.push({ element, eventType: 'mouseleave', listener: mouseLeaveListener })
    element.addEventListener('touchstart', touchStartListener, { passive: false })
    this.eventListeners.push({ element, eventType: 'touchstart', listener: touchStartListener })
    element.addEventListener('touchend', touchEndListener)
    this.eventListeners.push({ element, eventType: 'touchend', listener: touchEndListener })
  }

  // handleGamepadConnected handles gamepad connected events.
  private handleGamepadConnected(e: Event) {
    const event = e as GamepadEvent
    console.debug({
      source: 'ControllerManager.handleGamepadConnected',
      id: event.gamepad.id,
      index: event.gamepad.index,
      mapping: event.gamepad.mapping,
      connected: event.gamepad.connected,
      buttons: event.gamepad.buttons.length,
      axes: event.gamepad.axes.length,
      timestamp: event.gamepad.timestamp,
    })

    // Determine the player side
    let side: PlayerSide | undefined
    if (this.controllers.size === 0) {
      side = 'dark'
    } else if (this.controllers.size === 1) {
      for (const controller of this.controllers.values()) {
        if (controller.getPlayerSide() === 'dark') {
          side = 'light'
        } else if (controller.getPlayerSide() === 'light') {
          side = 'dark'
        }
        break
      }
    }

    // Check the controller
    const controller = this.getControllerByGamepad(event.gamepad)
    if (controller) {
      console.debug('controller already connected: %s', controller.id)
      controller.setState('connected')
      if (side) controller.setPlayerSide(side)
      return
    }

    // Add the controller
    const gc = new GameController(event.gamepad, side)
    this.controllers.set(gc.id, gc)
    if (this.onControllerConnected) this.onControllerConnected(this.game, gc)

    // Add periodic check for the new game and pause buttons
    // To prevent accidental new game action, the new game button only works when the game is not running (e.g. paused or over)
    if (!this.controllersInterval) {
      this.controllersInterval = setInterval(() => {
        if (this.game.getGameState() === 'running') return
        for (const controller of this.controllers.values()) {
          if (controller.getPlayerSide() !== undefined) {
            const { gamepad, state, isUpdated } = (controller as GameController).getGamepad()
            if (state !== 'connected' || !isUpdated) return
            const [,,,,,,,, pause, newGame] = gamepad.buttons
            if (pause.pressed) {
              this.togglePause()
              return
            } else if (newGame.pressed) {
              this.newGame()
              return
            }
          }
        }
      }, 100)
    }
  }

  // handleGamepadDisconnected handles gamepad disconnected events.
  private handleGamepadDisconnected(e: Event) {
    const event = e as GamepadEvent
    console.debug({
      source: 'ControllerManager.handleGamepadDisconnected',
      id: event.gamepad.id,
      index: event.gamepad.index,
      mapping: event.gamepad.mapping,
      connected: event.gamepad.connected,
      buttons: event.gamepad.buttons.length,
      axes: event.gamepad.axes.length,
      timestamp: event.gamepad.timestamp,
    })

    // Check the controller
    const controller = this.getControllerByGamepad(event.gamepad)
    if (!controller) {
      return
    }

    // Remove the controller
    this.controllers.delete(controller.id)
    if (this.onControllerDisconnected) this.onControllerDisconnected(this.game, controller)

    // Clear the periodic check if there are no controllers
    if (this.controllers.size === 0) {
      if (this.controllersInterval) clearInterval(this.controllersInterval)
      this.controllersInterval = undefined
    }
  }
}

// ControllerType represents a controller type.
type ControllerType = 'keyboard' | 'gamepad'

// ControllerState represents a controller state.
type ControllerState = 'connected' | 'disconnected'

// Controller represents a controller.
interface Controller {
  readonly id: string
  readonly type: ControllerType
  getState(): ControllerState
  setState(state: ControllerState): void
  getPlayerSide(): PlayerSide | undefined
  setPlayerSide(side: PlayerSide): void
}

// GameController represents a game controller.
class GameController implements Controller {
  public readonly id: string
  public readonly type: ControllerType = 'gamepad'
  private readonly gamepad: Gamepad
  private state: ControllerState = 'connected'
  private side?: PlayerSide
  private lastTimestamp: number = 0

  // constructor creates a new instance.
  constructor(gamepad: Gamepad, side?: PlayerSide) {
    this.id = 'g' + gamepad.index
    this.gamepad = gamepad
    this.state = gamepad.connected ? 'connected' : 'disconnected'
    this.side = side
  }

  // getState returns the state.
  public getState(): ControllerState {
    return this.state
  }

  // setState sets the state.
  public setState(state: ControllerState): void {
    this.state = state
  }

  // getPlayerSide returns the player side.
  public getPlayerSide(): PlayerSide | undefined {
    return this.side
  }

  // setPlayerSide sets the player side.
  public setPlayerSide(side: PlayerSide): void {
    this.side = side
  }

  // getGamepad returns the gamepad and state.
  public getGamepad(): {gamepad: Gamepad, state: ControllerState, isUpdated: boolean, side?: PlayerSide} {
    const gamepad = navigator.getGamepads()[this.gamepad.index]
    if (!gamepad) {
      this.state = 'disconnected'
      this.side = undefined
      return { gamepad: this.gamepad, state: this.state, isUpdated: false, side: this.side }
    }
    this.state = gamepad.connected ? 'connected' : 'disconnected'
    const isUpdated = gamepad.timestamp > this.lastTimestamp
    this.lastTimestamp = gamepad.timestamp
    return { gamepad, state: this.state, isUpdated: isUpdated, side: this.side }
  }
}

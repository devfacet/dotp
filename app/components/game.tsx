// For the full copyright and license information, please view the LICENSE.txt file.

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { GameService } from '@/app/services/game'
import { Game } from '@/lib/game'
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md'
import { useTheme } from 'next-themes'
import { useStopwatch } from 'react-timer-hook'
// import toast from 'react-hot-toast'
import '@/components/game.css'

// Init vars
const isGamepadSupported = typeof window !== 'undefined' && window.navigator.getGamepads !== undefined

// GameComponent represents a game component.
export default function GameComponent() {
  const { setTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameServiceRef = useRef<GameService>()
  const [score, setScore] = useState({ dark: 0, light: 0 })
  const [showSplash, setShowSplash] = useState(true)
  // const stopwatchOffset = new Date()
  // stopwatchOffset.setSeconds(stopwatchOffset.getSeconds() + 86390)
  const { seconds, minutes, hours, days, start: startStopwatch, pause: pauseStopwatch, reset: resetStopwatch } = useStopwatch({ autoStart: false })
  const stopwatchControlsRef = useRef({ start: () => {}, pause: () => {}, reset: () => {} })
  stopwatchControlsRef.current.start = startStopwatch
  stopwatchControlsRef.current.pause = pauseStopwatch
  stopwatchControlsRef.current.reset = resetStopwatch

  // onNewGameClick handles the new game click event.
  const onNewGameClick = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
  }

  // onGamePauseClick handles the game pause click event.
  const onGamePauseClick = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
  }

  // onNewGame handles the new game event.
  const onNewGame = useCallback((game: Game) => {
    console.debug('GameComponent.onNewGame', game.getId())
    stopwatchControlsRef.current.reset()
    stopwatchControlsRef.current.start()
  }, [])

  // onTogglePause handles the toggle pause event.
  const onTogglePause = useCallback((game: Game) => {
    console.debug('GameComponent.onTogglePause', game.getId(), game.getGameState())

    if (game.getGameState() === 'paused') {
      stopwatchControlsRef.current.pause()
    } else if (game.getGameState() === 'running') {
      stopwatchControlsRef.current.start()
    }
  }, [])

  // onGameOver handles the game over event.
  const onGameOver = useCallback((game: Game) => {
    console.debug('GameComponent.onTogglePause', game.getId(), game.getGameState(), game.getWinner())

    if (game.getWinner() === 'dark') {
      setScore((prevScore) => ({ ...prevScore, dark: prevScore.dark + 1 }))
    } else if (game.getWinner() === 'light') {
      setScore((prevScore) => ({ ...prevScore, light: prevScore.light + 1 }))
    }
    stopwatchControlsRef.current.pause()
  }, [setScore])

  // onVisibilityChange handles the visibility change event.
  const onVisibilityChange = useCallback(() => {
    console.debug('GameComponent.onVisibilityChange', document.visibilityState)

    if (gameServiceRef.current) {
      if (document.visibilityState !== 'visible') {
        stopwatchControlsRef.current.pause()
        gameServiceRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    console.debug('GameComponent.useEffect', 'main')
    setTheme('system')

    if (canvasRef.current) {
      document.addEventListener('visibilitychange', onVisibilityChange)

      // Init the game service
      gameServiceRef.current = new GameService({
        canvasElement: canvasRef.current,
        gamepadEnabled: isGamepadSupported,
        onNewGame: onNewGame,
        onTogglePause: onTogglePause,
        onGameOver: onGameOver,
      })
      gameServiceRef.current.handleMouseEvent('controlW', 'w', 'dark')
      gameServiceRef.current.handleMouseEvent('controlS', 's', 'dark')
      gameServiceRef.current.handleMouseEvent('controlO', 'o', 'light')
      gameServiceRef.current.handleMouseEvent('controlL', 'l', 'light')

      // Splash screen
      if (showSplash) {
        gameServiceRef.current.splash()
        setShowSplash(false)
      }
    }

    // Cleanup
    return () => {
      console.debug('GameComponent.useEffect', 'cleanup')
      gameServiceRef.current?.destroy()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [showSplash, onNewGame, onTogglePause, onGameOver, onVisibilityChange, setTheme])

  return (
    <div className="gameWrapper">
      <div className="row">
        <div className="stats">
          <div className="item bg-light dark:bg-dark">{score.dark} - {score.light}</div>
          <div className="item bg-light dark:bg-dark">{days}:{hours}:{minutes}:{seconds}</div>
        </div>
      </div>
      <div className="row">
        <div className="playerControls">
          <div id="controlW" className="item hover:cursor-pointer bg-light dark:bg-dark"><MdArrowUpward /><span className="shortcut">W</span></div>
          <div id="controlS" className="item hover:cursor-pointer bg-light dark:bg-dark"><span className="shortcut">S</span><MdArrowDownward /></div>
        </div>
        <div className="canvasContainer">
          <canvas
            ref={canvasRef}
            width="512"
            height="512"
            className='canvas'
            onClick={(event) => {
              if (event.clientX < window.innerWidth / 2) {
                setTheme('dark')
              } else if (event.clientX > window.innerWidth / 2) {
                setTheme('light')
              }
            }}
          />
        </div>
        <div className="playerControls">
          <div id="controlO" className="item hover:cursor-pointer bg-light dark:bg-dark"><MdArrowUpward /><span className="shortcut">O</span></div>
          <div id="controlL" className="item hover:cursor-pointer bg-light dark:bg-dark"><span className="shortcut">L</span><MdArrowDownward /></div>
        </div>
      </div>
      <div className="row">
        <div className="gameControls">
          <div className="item hover:cursor-pointer bg-light dark:bg-dark" onClick={onNewGameClick}><span><span className="shortcut">N</span>ew Game</span></div>
          <div className="item hover:cursor-pointer bg-light dark:bg-dark" onClick={onGamePauseClick}><span><span className="shortcut">P</span>ause</span></div>
        </div>
      </div>
    </div>
  )
}

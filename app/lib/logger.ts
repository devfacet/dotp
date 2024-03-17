// For the full copyright and license information, please view the LICENSE.txt file.

import pino, { LoggerOptions, Logger as PinoLogger } from 'pino'

// Init vars
const loggerTarget = process.env.LOGGER_TARGET
const loggerOpts: LoggerOptions = {
  name: process.env.APP_NAME,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization'],
  },
}
if (loggerTarget) {
  loggerOpts.transport = {
    target: loggerTarget
  }
}
const baseLogger = pino(loggerOpts)
const logger: ExtendedLogger = {
  ...baseLogger,
  fatal: (msg, ...args) => {
    baseLogger.fatal(msg, ...args)
    process.exit(1)
  }
}

// ExtendedLogger extends PinoLogger.
interface ExtendedLogger extends PinoLogger {
  fatal: (obj: any, ...args: any[]) => void
}

// Options represents the options for the logger.
type Options = {
  path?: string
  sep?: string
}

// Logger returns a new logger instance with the given options.
export function Logger({ path, sep }: Options): ExtendedLogger {
  const bindings: any = {}
  if (path) {
    bindings.source = sep ? (path.includes(sep) ? path.split(sep)[1].substring(1) : path) : path
  }
  const childLogger = baseLogger.child(bindings) as ExtendedLogger
  childLogger.fatal = logger.fatal.bind(childLogger)
  return childLogger
}

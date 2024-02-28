// For the full copyright and license information, please view the LICENSE.txt file.

import 'server-only'
import fs from 'fs'
import path from 'path'

// Init vars
const nodeEnvCache = new Map<string, string>()
const appEnvCache = new Map<string, string>()

// Load the environment files
const envFiles = process.env.APP_ENV_FILES ? process.env.APP_ENV_FILES.split(',') : []
envFiles.forEach((file) => loadEnvFile(file))

// lookupEnv lookups the value of the environment variable named by the key.
export const lookupEnv = (key: string): string | undefined => {
  return process.env[key]
}

// getEnv returns the value of the environment variable named by the key.
export const getEnv = (key: string, _default: string = ''): string => {
  const val = process.env[key]
  if (!val) {
    return _default
  }
  return val
}

// getNodeEnv returns the Node environment which is either 'production', 'development' or 'test'.
export const getNodeEnv = (key: string = 'NODE_ENV'): string => {
  if (nodeEnvCache.has(key)) {
    return nodeEnvCache.get(key) as string
  }
  const val = normalizeEnv(key)
  nodeEnvCache.set(key, val)
  return val
}

// getAppEnv returns the application environment which is either 'production', 'development' or 'test'.
export const getAppEnv = (key: string = 'APP_ENV'): string => {
  if (appEnvCache.has(key)) {
    return appEnvCache.get(key) as string
  }
  const val = normalizeEnv(key)
  appEnvCache.set(key, val)
  return val
}

// normalizeEnv normalizes the environment variable value.
function normalizeEnv(key: string): string {
  let val = process.env[key]
  switch (process.env[key]) {
    case 'production':
    case 'prd':
    case 'prod':
      val = 'production'
      break
    case 'development':
    case 'dev':
    case 'local':
    case 'stg':
    case 'stage':
      val = 'development'
      break
    case 'test':
      val = 'test'
      break
    default:
      val = 'development'
      break
  }
  return val
}

// loadEnvFile loads the environment variables from the given file.
function loadEnvFile(file?: string) {
  // Check the file
  if (!file) return
  const filepath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(filepath)) {
    console.debug(`env file not found filepath=${filepath}`)
    return
  }

  // Load the file
  const buildEnvContent = fs.readFileSync(filepath, 'utf8')
  buildEnvContent.split('\n').forEach((line) => {
    if (line.trim() === '' || line.startsWith('#') || !line.includes('=')) {
      return
    }
    const [key, value] = line.split('=', 2)
    process.env[key] = value
  })
  console.debug(`env file loaded from filepath=${filepath}`)
}

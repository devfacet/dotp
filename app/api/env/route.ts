// For the full copyright and license information, please view the LICENSE.txt file.

import 'server-only'
import { lookupEnv, getAppEnv } from '@/app/lib/env'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // defaults to auto

// Init types
type GetResponse = {
  env: string
  version?: string
  commit?: string
  error?: string
}

export async function GET() {
  // Init vars
  const res: GetResponse = {
    env: getAppEnv(),
    version: lookupEnv('GIT_RELEASE'),
    commit: lookupEnv('GIT_COMMIT'),
  }

  return NextResponse.json(res, { status: 200 })
}

// For the full copyright and license information, please view the LICENSE.txt file.

// tryError returns an error from a try catch block.
export function tryError(e: any): Error {
  return (e instanceof Error) ? e : new Error(e.message || e)
}

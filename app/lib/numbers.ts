// For the full copyright and license information, please view the LICENSE.txt file.

// randomNumber returns a random number between min and max.
export function randomNumber(min?: number, max?: number): number {
  if (min === undefined) min = Number.MIN_SAFE_INTEGER
  if (max === undefined) max = Number.MAX_SAFE_INTEGER
  return Math.random() * (max - min) + min
}

// uuid returns a random UUID.
export function uuid(): string {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
  )
}

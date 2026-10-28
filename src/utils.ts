/**
 * Trims excess floating point precision to at most 6 decimal places without trailing zeroes.
 * Prevents precision loss on USDC/EURC atomic unit conversions (1e6).
 */
export function cleanDecimal(n: number | string, maxDecimals = 6): number {
  const num = Number(n);
  if (isNaN(num)) return 0;
  return Number(num.toFixed(maxDecimals));
}


import { PROVIDER_PATTERNS } from '../config/data.js';

export function identifyProvider(mx) {
  if (!mx.length) return { name: 'Unknown', type: 'unknown' };

  const host = mx[0].exchange;
  for (const p of PROVIDER_PATTERNS) {
    if (p.match.test(host)) return p;
  }
  return { name: 'Custom', type: 'business' };
}

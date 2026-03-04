import crypto from 'crypto';
import { smtpProbe } from './smtpProbe.js';

export async function detectCatchAll(domain, mxs, from, timeout) {
  const fromDomain = from.split('@')[1] || 'example.org';
  const fake = `${crypto.randomBytes(6).toString('hex')}@${domain}`;

  for (const mx of mxs) {
    const res = await smtpProbe(mx.exchange, [
      `HELO ${fromDomain}`,
      `MAIL FROM:<${from}>`,
      `RCPT TO:<${fake}>`
    ], timeout);

    // If MX responds definitively
    if (res.code === 250) {
      console.log(`[CatchAll] MX ${mx.exchange} accepted catch-all address.`);
      return true;
    }
    if (res.code === 550) {
      console.log(`[CatchAll] MX ${mx.exchange} rejected catch-all address.`);
      return false;
    }

    // If transient error, timeout or connection error, try next MX
    console.log(`[CatchAll] Check failed on MX ${mx.exchange} with code ${res.code} (${res.reason || 'unknown'}). Trying next...`);
  }

  // If all MX records exhausted without definitive answer, return null (inconclusive)
  return null;
}

import { smtpProbeWithRetry } from './smtpProbe.js';

export async function verifyMailbox(email, mxs, from, timeout, retryConfig = {}) {
  for (const mx of mxs) {
    const res = await smtpProbeWithRetry(mx.exchange, [
      `HELO ${from.split('@')[1] || 'example.org'}`,
      `MAIL FROM:<${from}>`,
      `RCPT TO:<${email}>`
    ], timeout, retryConfig);

    if ([250, 251].includes(res.code)) {
      console.log(`[MailBox] Valid mailbox on ${mx.exchange}`);
      return { result: true, mx: mx.exchange, attempts: res.attempts };
    }
    if ([550, 551, 553].includes(res.code)) {
      console.log(`[MailBox] Invalid mailbox on ${mx.exchange}`);
      return { result: false, reason: 'permanent-error', mx: mx.exchange, attempts: res.attempts };
    }
  }
  console.log(`[MailBox] All MX checks failed.`);
  return { result: null, reason: 'all-mx-failed' };
}

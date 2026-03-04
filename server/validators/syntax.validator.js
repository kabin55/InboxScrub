import { LIMITS } from '../config/data.js';
import { toAsciiDomain } from '../utils/idn.js';

export function validateSyntax(email) {
  console.log(`[SyntaxValidator] Validating syntax for: ${email}`);
  if (typeof email !== 'string') return { valid: false };

  const value = email.trim();
  if (!value || value.length > LIMITS.EMAIL_MAX) return { valid: false };

  const regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
  if (!regex.test(value)) return { valid: false };

  const [localPart, domain] = value.split('@');
  const asciiDomain = toAsciiDomain(domain);
  if (!asciiDomain) return { valid: false };

  console.log(`[SyntaxValidator] Valid syntax. Local: ${localPart}, Domain: ${asciiDomain}`);
  return { valid: true, localPart, domain, asciiDomain };
}

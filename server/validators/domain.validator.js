import dns from 'dns/promises';
import { LIMITS } from '../config/data.js';

export async function validateDomain(domain, timeout) {
  if (!domain || domain.length > LIMITS.DOMAIN_MAX) return { valid: false };

  const labels = domain.split('.');
  if (labels.length < 2) return { valid: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    await Promise.any([
      dns.resolve4(domain, { signal: controller.signal }),
      dns.resolve6(domain, { signal: controller.signal })
    ]);
    clearTimeout(timer);
    console.log(`[DomainValidator] Domain ${domain} resolved successfully.`);
    return { valid: true };
  } catch (error) {
    clearTimeout(timer);
    console.log(`[DomainValidator] Domain ${domain} resolution failed: ${error.message}`);
    return { valid: true, warning: 'No A/AAAA records (MX may still exist)' };
  }
}

import dns from 'dns/promises';

export async function lookupMx(domain, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const mx = await dns.resolveMx(domain, { signal: controller.signal });
    console.log(`[MxValidator] MX records for ${domain}:`, mx);
    return mx.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.log(`[MxValidator] MX lookup failed for ${domain}: ${error.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

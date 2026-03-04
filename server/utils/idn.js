// Safe internationalized domain handling

export function toAsciiDomain(domain) {
  try {
    return new URL(`http://${domain}`).hostname;
  } catch {
    return null;
  }
}

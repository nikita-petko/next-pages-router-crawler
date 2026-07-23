// Get the second-to-last level of the domain for the cookie
export default function getSessionCookieDomain(): string {
  const { hostname } = window.location;
  // This will split the hostname into parts
  const parts = (hostname || '').split('.');

  // Check if the hostname is an IP address or a local host name
  if (parts.length === 4 && parts.every((part) => parseInt(part, 10) >= 0)) {
    // This is an IP address, return as is
    return hostname;
  }

  if (parts.length <= 2) {
    // Localhost or a domain without a subdomain, return as is
    return hostname;
  }
  // domain (SLD) e.g example.co.uk
  const isSLDDomain =
    parts[parts.length - 1].length + parts[parts.length - 2].length <= 5 && parts.length >= 3;
  if (isSLDDomain) {
    const hasSubdomain = parts.length > 3;
    return hasSubdomain ? `.${parts.slice(1).join('.')}` : parts.join('.');
  }
  // Return the domain one-level up
  return `.${parts.slice(1).join('.')}`;
}

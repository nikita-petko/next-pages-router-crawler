// utility function to check if a url for user consumption is valid
// (HTTPS with default port (or is localhost))
export function isUserAccessedLinkValid(uri: string): boolean {
  if (uri === '') {
    return true;
  }
  let url;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }

  return (
    url.protocol === 'https:' && url.hostname !== 'localhost' && (!url.port || url.port === '443')
  );
}

// custom schemes that are rejected by back-end
const illegalRedirectUriProtocols = [
  'admin:',
  'blob:',
  'callto:',
  'chrome:',
  'cid:',
  'content:',
  'data:',
  'dns:',
  'facetime:',
  'fax:',
  'file:',
  'finger:',
  'fish:',
  'ftp:',
  'git:',
  'go:',
  'imap:',
  'ldap:',
  'ldaps:',
  'magnet:',
  'mailto:',
  'market:',
  'message:',
  'mms:',
  'payto:',
  's3:',
  'sftp:',
  'slack:',
  'sms:',
  'ssh:',
  'steam:',
  'tel:',
  'telnet:',
  'udp:',
  'web:',
  'webcal:',
  'ws:',
  'zoommtg:',
  'zoomus:',
];

// https://www.ietf.org/rfc/rfc2396.txt
const schemeRegExp = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/?/;

// utility function to check if a url is a valid redirect URI
// (HTTPS with default port, or HTTP on localhost with any port, or a custom scheme)
export function isRedirectUriValid(uri: string): boolean {
  if (uri === '') {
    return true;
  }

  // check if the URI has a scheme
  const hasScheme = schemeRegExp.test(uri);

  let url;
  try {
    // append scheme if none provided so URL parsing passes, default to http if none provided
    // (we will later return false if trying to use a scheme-less non-localhost uri)
    url = hasScheme ? new URL(uri) : new URL(`http://${uri}`);
  } catch {
    return false;
  }

  if (url.protocol === 'https:') {
    return url.hostname === 'localhost' || !url.port || url.port === '443';
  }

  if (url.protocol === 'http:') {
    return url.hostname === 'localhost';
  }

  return !illegalRedirectUriProtocols.includes(url.protocol);
}

export default function getCurrentUrl(includeHash?: boolean): string {
  let url = window.location.href;
  if (!includeHash) {
    // ignore the hash part in url
    url = url.replace(/#.*$/, '');
  }
  return url;
}

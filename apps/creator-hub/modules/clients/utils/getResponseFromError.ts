export default function getResponseFromError(e: unknown) {
  if (e && typeof e === 'object' && 'response' in e) {
    return e.response as Response;
  }

  if (e && typeof e === 'object' && 'json' in e) {
    return e as Response;
  }

  return null;
}

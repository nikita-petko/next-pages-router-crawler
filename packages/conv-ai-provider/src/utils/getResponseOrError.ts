// attempts to extract response from a ResponseError, otherwise just returns the error as is
export default function getResponseOrError(e: unknown): Response | Error {
  if (e && typeof e === 'object' && 'response' in e) {
    return e.response as Response;
  }

  if (e && typeof e === 'object' && 'json' in e) {
    return e as Response;
  }

  return e as Error;
}

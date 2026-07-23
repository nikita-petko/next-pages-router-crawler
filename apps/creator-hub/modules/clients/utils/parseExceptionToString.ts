import tryParseResponseError from './tryParseResponseError';

export default async function parseExceptionToString(e: unknown): Promise<string> {
  if (e instanceof Error) {
    return e.toString();
  }
  const error = await tryParseResponseError(e);
  if (error !== null) {
    return `code=${error.code} message="${error.message}"`;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return `${e}`;
  }
}

export interface AMAErrorResponseType {
  error: AMAErrorType;
}

export interface AMAErrorType {
  code: string;
  message: string;
}

interface HttpErrorOptions {
  message: string;
  responseData?: object;
  status: number;
  statusText?: string;
  url: string;
  // You can add more properties here as needed, e.g., 'method', 'headers', etc.
}

export const parseResponseErrorToAMAError = async (
  error: unknown,
): Promise<AMAErrorResponseType | undefined> => {
  if (
    error instanceof Error &&
    error.name === 'ResponseError' &&
    'response' in error &&
    error.response instanceof Response
  ) {
    try {
      const body = await error.response.clone().json();
      if (body?.error?.message) {
        return { error: { code: body.error.code ?? '', message: body.error.message } };
      }
    } catch {
      // Body not JSON-parseable, fall through to undefined
    }
  }
  return undefined;
};

export class HttpError extends Error {
  public status: number;

  public statusText?: string;

  public responseData?: object;

  public url: string;

  constructor(options: HttpErrorOptions) {
    // Call the parent (Error) constructor with the message
    super(options.message);

    // Set the name of the error for better identification
    this.name = 'HttpError';

    // Assign properties from the options object
    this.status = options.status;
    this.statusText = options.statusText;
    this.responseData = options.responseData;
    this.url = options.url;

    // This ensures the stack trace is correctly captured in modern JS engines
    // without polluting the stack with the constructor call itself.
    // Important for ensuring `instanceof HttpError` works correctly.
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Extracts the HTTP status code from a thrown error if it carries one. Handles
 * the `axios`-based clients (`AxiosError`), the generated-client `ResponseError`
 * (whose `response` is a fetch `Response`), and our own {@link HttpError}.
 * Returns `undefined` when the error has no identifiable status (e.g. network
 * failures, thrown plain `Error`s), so callers can fall back to a generic
 * message.
 */
export const getHttpStatusFromError = (error: unknown): number | undefined => {
  if (error instanceof HttpError) {
    return error.status;
  }
  // `axios` rejects with an `AxiosError` carrying `response.status` (and, on
  // newer axios, a top-level `status`). Duck-type both so this works for the
  // axios-based clients (e.g. the thumbnails client) without importing axios.
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { isAxiosError?: unknown }).isAxiosError === true
  ) {
    const axiosError = error as { response?: { status?: unknown }; status?: unknown };
    if (typeof axiosError.response?.status === 'number') {
      return axiosError.response.status;
    }
    if (typeof axiosError.status === 'number') {
      return axiosError.status;
    }
  }
  // The generated client throws a `ResponseError` whose `response` is the fetch
  // `Response`. Duck-type `response.status` instead of `instanceof Response` so
  // this works regardless of whether the `Response` global is present.
  if (error instanceof Error && error.name === 'ResponseError' && 'response' in error) {
    const { response } = error as { response?: { status?: unknown } };
    if (response != null && typeof response.status === 'number') {
      return response.status;
    }
  }
  return undefined;
};

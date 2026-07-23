// Shared HTTP utilities for talent-hub-v2 API clients.
// TODO: Remove once all endpoints migrate to generated @rbx/clients.

const CSRF_TOKEN_HEADER = 'x-csrf-token';

export type ApiErrorBody = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
};

export type ApiRequestError = Error & {
  response?: { status: number };
  errorBody?: ApiErrorBody;
};

function isRecord(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length === value.length ? strings : undefined;
}

function toApiErrorBody(value: unknown): ApiErrorBody {
  if (!isRecord(value)) {
    return {};
  }

  const errorsValue = Reflect.get(value, 'errors');
  const errors: Record<string, string[]> = {};
  if (isRecord(errorsValue)) {
    Object.entries(errorsValue).forEach(([key, entryValue]) => {
      const stringArray = toStringArray(entryValue);
      if (stringArray) {
        errors[key] = stringArray;
      }
    });
  }

  return {
    type: typeof Reflect.get(value, 'type') === 'string' ? Reflect.get(value, 'type') : undefined,
    title:
      typeof Reflect.get(value, 'title') === 'string' ? Reflect.get(value, 'title') : undefined,
    status:
      typeof Reflect.get(value, 'status') === 'number' ? Reflect.get(value, 'status') : undefined,
    detail:
      typeof Reflect.get(value, 'detail') === 'string' ? Reflect.get(value, 'detail') : undefined,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

export function hasResponseStatus(err: unknown): err is { response: { status: number } } {
  if (!isRecord(err)) {
    return false;
  }
  const response = Reflect.get(err, 'response');
  if (!isRecord(response)) {
    return false;
  }
  return typeof Reflect.get(response, 'status') === 'number';
}

export function isApiRequestError(err: unknown): err is ApiRequestError {
  return err instanceof Error && hasResponseStatus(err);
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      const parsed: unknown = await response.json();
      body = toApiErrorBody(parsed);
    } catch {
      /* non-JSON response */
    }
    const message = body.detail || body.title || `HTTP ${response.status}`;
    const requestError: ApiRequestError = Object.assign(new Error(message), {
      response: { status: response.status },
      errorBody: body,
    });
    throw requestError;
  }
  return response.json();
}

export async function fetchWithCsrf(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (response.status === 403) {
    const token = response.headers.get(CSRF_TOKEN_HEADER);
    if (token) {
      const headers = new Headers(init.headers);
      headers.set(CSRF_TOKEN_HEADER, token);
      return fetch(url, { ...init, headers });
    }
  }
  return response;
}

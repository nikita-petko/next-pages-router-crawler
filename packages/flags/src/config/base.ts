import { overrideResponseSchema } from '../schema';
import type { TInitFlagsConfig, TInitFlagsReturn, TOverrideOptions } from '../types';
import { register } from './overrides';
import type { TServerOverrides } from './overrides';

export const FLAG_OVERRIDES_QUERY_PARAM = 'flag-overrides';

let config: TInitFlagsConfig | null = null;
let overridesEnabled = false;
let pendingServerOverrides: TServerOverrides;

function assertInitialized(
  flagsConfig: TInitFlagsConfig | null,
): asserts flagsConfig is TInitFlagsConfig {
  if (flagsConfig === null) {
    throw new Error('@rbx/flags: needs to be initialized first!');
  }
}

export function getConfig(): TInitFlagsConfig {
  assertInitialized(config);
  return config;
}

export function isOverridesEnabled(): boolean {
  return overridesEnabled;
}

function getFlagOverridesQueryValue(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get(FLAG_OVERRIDES_QUERY_PARAM);
}

async function checkDefaultAuthorization(): Promise<boolean> {
  pendingServerOverrides = undefined;

  try {
    const flagsConfig = getConfig();
    const url = new URL('/barista-feature-flags/v1/override-status', flagsConfig.baseUrl);
    const flagOverrides = getFlagOverridesQueryValue();
    if (flagOverrides) {
      url.searchParams.set(FLAG_OVERRIDES_QUERY_PARAM, flagOverrides);
    }

    const response = await fetch(url, {
      credentials: 'include',
    });

    // The `override-status` endpoint always returns HTTP 200 with body
    // `{ isOverrideAllowed: boolean, override?: [...] }` when the controller runs (see
    // barista-feature-flags tech-spec §9.5). The `isOverrideAllowed` field
    // -- not the status code -- is the sole authorization signal. A non-2xx
    // response (e.g. gateway 401, network 5xx) means the endpoint did not
    // produce a decision; default to "not allowed" so a degraded auth
    // dependency cannot accidentally enable overrides for everyone.
    if (!response.ok) {
      return false;
    }

    const body = await response.json().then((json) => overrideResponseSchema.parseAsync(json));
    pendingServerOverrides = body.override;
    return body.isOverrideAllowed;
  } catch {
    return false;
  }
}

async function resolveAuthorization(
  options: Extract<TOverrideOptions, { mode: 'authorized-only' }>,
): Promise<boolean> {
  pendingServerOverrides = undefined;
  const authorized = 'authorize' in options ? await options.authorize().catch(() => false) : false;

  if (authorized || (options.useDefault && (await checkDefaultAuthorization()))) {
    overridesEnabled = true;
    register(pendingServerOverrides);
    return true;
  }

  return false;
}

async function enableOverrides(options: TOverrideOptions): Promise<boolean> {
  assertInitialized(config);

  if (options.mode === 'development') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        "@rbx/flags: development overrides are enabled in a production build — is this intentional? Use 'authorized-only' mode with an authorize function for production.",
      );
    }

    overridesEnabled = true;
    register();
    return true;
  }

  if (options.mode === 'authorized-only') {
    try {
      return await resolveAuthorization(options);
    } catch {
      // fall through to the shared unauthorized return below
    }
  }

  return false;
}

// `URL.canParse` is Safari 17+, so we use a try/catch to support older browsers.
function canParseUrl(url: string): boolean {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
}

export function initFlags({ baseUrl, applicationId }: TInitFlagsConfig): TInitFlagsReturn {
  if (config !== null) {
    throw new Error('@rbx/flags: config has already been initialized!');
  }

  if (!canParseUrl(baseUrl)) {
    throw new Error('@rbx/flags: base URL is invalid!');
  }

  config = { baseUrl, applicationId };

  return { enableOverrides };
}

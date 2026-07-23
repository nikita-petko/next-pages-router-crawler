import { StatusCodes } from '@rbx/core';
import type { ErrorEvent } from '@sentry/core';
import {
  browserTracingIntegration,
  extraErrorDataIntegration,
  init,
  replayIntegration,
} from '@sentry/nextjs';

import { InBrowser } from '@utils/browser';

// Note(@seanzhang, 03/18/2025): Tree Shaking Problem
// sentry.ts got tree shaked out of the build by webpack
// So we explicitly add this file into sideEffects in package.json
// And we need to do import '@utils/sentry'; in _app.tsx

// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const DOWNSAMPLED_STATUS_CODES = [
  StatusCodes.UNAUTHORIZED,
  StatusCodes.FORBIDDEN,
  StatusCodes.TOO_MANY_REQUESTS,
  StatusCodes.BAD_GATEWAY,
  StatusCodes.SERVICE_UNAVAILABLE,
  StatusCodes.GATEWAY_TIMEOUT,
];
const DOWNSAMPLE_KEEP_RATE = 0.1;

export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  const message = event.exception?.values?.[0]?.value;
  const isDownsampledAxiosError =
    typeof message === 'string' &&
    DOWNSAMPLED_STATUS_CODES.some((code) => message.includes(`status code ${code}`));
  if (isDownsampledAxiosError && Math.random() >= DOWNSAMPLE_KEEP_RATE) {
    return null;
  }
  return event;
}

if (InBrowser()) {
  init({
    allowUrls: [
      /https?:\/\/advertise\.roblox\.com/,
      /https?:\/\/advertise\.sitetest1\.robloxlabs\.com/,
      /https?:\/\/create\.roblox\.com\/advertise/,
      /https?:\/\/create\.sitetest1\.robloxlabs\.com\/advertise/,
      /https?:\/\/assets\.create\.roblox\.com/,
      /https?:\/\/assets\.create\.sitetest1\.robloxlabs\.com/,
    ],
    attachStacktrace: true,
    beforeSend,
    denyUrls: [
      /https?:\/\/localhost(:\d+)?/i,
      // NOTE(jcountryman, 02/28/23): Explicitly removing errors from chrome extensions
      /extensions\//i,
      /^chrome(-extensions?)?:\/\//i,
    ],
    dsn: 'https://0bba254bbe32fbb6b0d98f99ada92400@o293668.ingest.us.sentry.io/4507433013411840',
    enabled: process.env.environment === 'staging' || process.env.environment === 'production',
    environment: process.env.environment,
    ignoreErrors: [
      // Ignore since this is triggered from Universal App's webview
      'window.Roblox.Hybrid',
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
      // NOTE(seanzhang, 03/19/25): Ignore errors from timezone enum 295
      'Unsupported Timezone Enum Value 295',
      'Event `CustomEvent` (type=unhandledrejection) captured as promise rejection',
      // NOTE(seanzhang, 06/20/25): Likely blocked by adblocker
      'The request failed and the interceptors did not return an alternative response',

      // Network/connectivity errors -- user-side network issues, not application bugs
      'Network Error',
      'Failed to fetch',
      'Load failed',
      'Request aborted',
      'CanceledError',

      // DOM manipulation errors -- caused by browser extensions (translation, ad blockers)
      // modifying the DOM, conflicting with React's reconciliation. See React#11538.
      'removeChild',
      'The object can not be found here',

      // Challenge errors from 2SV flow -- token expiration/invalidation, not a code bug.
      // Tracks as UX friction (~6 users/day) but not actionable in Sentry.
      'challenge error for challenge kind invalidated',

      // Third-party/browser extension errors -- not our code
      'runtime.sendMessage',
      'window.ethereum',
      /xbrowser/i,
      /swbrowser/i,
      '__firefox__',
      'getInitialProps',
    ],
    integrations: [
      browserTracingIntegration(),
      replayIntegration(),
      // https://docs.sentry.io/platforms/javascript/configuration/integrations/extraerrordata/
      // https://github.com/getsentry/sentry-javascript/issues/2210#issuecomment-528831900
      // Try to capture more error data for unhandled rejection errors
      extraErrorDataIntegration(),
    ],
    normalizeDepth: 5,
    normalizeMaxBreadth: 2000,
    release: process.env.sentryRelease,
    // NOTE (jcountryman, 02/02/23): Capture video reproduction when errors occur
    // for triage.
    replaysOnErrorSampleRate: 1,
    // Event quota is 1000 per day for ads manager, 41 per hour.
    sampleRate: 0.5,
    // NOTE (jcountryman, 02/02/23): Capture performance metrics
    tracesSampleRate: 0.1,
  });
}

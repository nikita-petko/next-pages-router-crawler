/* eslint-disable no-console */

/* used to intercept network requests in the browser for testing purposes
 *  initialized in _app.tsx
 *  only used in development and testing environments */

// eslint-disable-next-line import/no-extraneous-dependencies
import { setupWorker, SetupWorkerApi } from 'msw/browser';

import { mockHandlers } from '@constants/mswConstants';

// ----------------------------------------------------
// IMPORTANT: Create the worker instance ONCE
// outside of the function, so it's a singleton.
// ----------------------------------------------------

let worker: SetupWorkerApi | null = null;

const initializeWorker = () => {
  if (!worker) {
    worker = setupWorker(...mockHandlers) as SetupWorkerApi;
  }
};

// Removes any MSW service worker left registered by a previous `dev:msw` run.
// Service workers persist across page reloads and dev-server restarts, so after
// switching to a non-MSW server (dev:development, etc.) the stale worker keeps
// intercepting every request and failing (breaking auth, translations, and
// causing FetchError storms). Best-effort: only targets mockServiceWorker.js and
// silently ignores environments without service worker support.
export const UnregisterMockServiceWorker = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const mswRegistrations = registrations.filter((registration) => {
      const scriptUrl =
        registration.active?.scriptURL ??
        registration.waiting?.scriptURL ??
        registration.installing?.scriptURL ??
        '';
      return scriptUrl.includes('mockServiceWorker');
    });

    if (mswRegistrations.length === 0) {
      return;
    }

    await Promise.all(mswRegistrations.map((registration) => registration.unregister()));
    console.log(
      `MSW: Unregistered ${mswRegistrations.length.toString()} stale mock service worker(s). Reload once to fully detach.`,
    );
  } catch (error) {
    console.error('MSW: Failed to unregister stale mock service worker:', error);
  }
};

export const SetupMockHandlers = async () => {
  if (!worker) {
    initializeWorker();
    // eslint-disable-next-line no-console
    console.log('MSW: Setting up mock handlers...');
    console.log('MSW: Total handlers to register:', mockHandlers.length);
    // Make it async
    // Optional: Check if already running to prevent errors if called multiple times
    try {
      await worker!.start({
        // Await the start to ensure it's ready
        onUnhandledRequest: 'warn', // Keep this for debugging
        quiet: false, // Show all intercepted requests
      });
      // eslint-disable-next-line no-console
      console.log('✅ MSW: Worker started successfully.');
      console.log('MSW: Registered handlers:', mockHandlers.length);
      console.log('MSW: Service worker file should be at /mockServiceWorker.js');
      console.log('MSW: If requests are not intercepted, check console for 🌐 Axios messages');
    } catch (error) {
      console.error('❌ MSW: Failed to start worker:', error);
      console.log('🔧 MSW: Check if /public/mockServiceWorker.js exists');
      console.log('🔧 MSW: Run "npx msw init public --save" if needed');
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('MSW: Worker already running, resetting handlers.');
    worker.resetHandlers(...mockHandlers); // Reset handlers if already running
  }
};

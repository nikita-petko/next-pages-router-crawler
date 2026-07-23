import * as Sentry from '@sentry/nextjs';

const throwError = (message: string) => {
  const err = new Error(message);
  if (process?.env?.environment?.toLowerCase() === 'development') {
    throw err;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry?.captureException(err);
};

export default throwError;

import { captureException } from '@sentry/nextjs';

const throwError = (message: string) => {
  const err = new Error(message);
  if (process?.env?.environment?.toLowerCase() === 'development') {
    throw err;
  }
  console.error(err);
  captureException(err);
};

export default throwError;

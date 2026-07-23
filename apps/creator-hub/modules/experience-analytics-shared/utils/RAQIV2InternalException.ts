import type { RAQIV2ChartResource } from '@modules/clients/analytics';

enum RAQIV2InternalException {
  ResourceLoading = 'Resource not loaded yet',
}

export const maybeThrowRAQIV2InternalException = (
  resource: RAQIV2ChartResource,
  sourceFn: string,
): void => {
  if (resource.isLoading) {
    throw new Error(`${RAQIV2InternalException.ResourceLoading} in ${sourceFn}`);
  }
};

export const isLoadingRAQIV2Prerequisites = (resource: RAQIV2ChartResource): boolean => {
  return !!resource.isLoading;
};

export const isRAQIV2LoadingException = (e: unknown): boolean => {
  return `${e}`.includes(RAQIV2InternalException.ResourceLoading);
};

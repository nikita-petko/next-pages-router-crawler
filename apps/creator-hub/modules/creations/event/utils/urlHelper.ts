import { www } from '@modules/miscellaneous/urls';

/**
 * Appends a query parameter to a given url path if the parameter value is defined
 * @param targetPath The url path to potentially augment
 * @param queryParam The queryParam to potentially add
 * @param queryParamValue The value of the queryParam to potentially add
 * @returns The original path if queryParamValue is undefined, the path with the queryParam appended if not
 */
const maybeAppendQueryParam = (
  targetPath: string,
  queryParam: string,
  queryParamValue: string | undefined,
): string => {
  if (!queryParamValue) {
    return targetPath;
  }

  const targetUrl = new URL(targetPath, www.getUrl());
  targetUrl.searchParams.append(queryParam, queryParamValue);

  return targetUrl.pathname + targetUrl.search;
};

export default maybeAppendQueryParam;

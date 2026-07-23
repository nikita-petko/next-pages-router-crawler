import type { ParsedUrlQuery } from 'node:querystring';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';
import { useRouter } from 'next/router';
import type { FC } from 'react';
import React, { Fragment, useEffect } from 'react';
import type { TUrlRedirectSetting } from '../constants/urlRedirectSettings';
import urlRedirectSettings from '../constants/urlRedirectSettings';

const UrlRedirectProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const matchedUrlRedirectSetting: TUrlRedirectSetting | undefined = urlRedirectSettings.find(
      (redirect) => redirect.oldUrl === router.pathname,
    );
    if (!matchedUrlRedirectSetting) {
      return;
    }

    const newUrl = matchedUrlRedirectSetting.getNewUrl(router.query);
    if (!newUrl) {
      return;
    }

    if (!matchedUrlRedirectSetting.preserveQueryParams) {
      router.push(newUrl);
      return;
    }

    const parsedUrl = parseUrl(newUrl);
    const filteredRouterQuery = { ...router.query };
    matchedUrlRedirectSetting.queryParamsToIgnore?.forEach(
      (param) => delete filteredRouterQuery[param],
    );
    const query: ParsedUrlQuery = { ...parsedUrl.query, ...filteredRouterQuery };
    router.push({ ...parsedUrl, query });
  }, [router]);

  return <>{children}</>;
};

export default UrlRedirectProvider;

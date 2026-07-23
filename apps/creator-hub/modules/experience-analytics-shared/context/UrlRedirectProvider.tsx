import { useRouter } from 'next/router';
import React, { FC, Fragment, useEffect } from 'react';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';
import { ParsedUrlQuery } from 'querystring';
import urlRedirectSettings, { TUrlRedirectSetting } from '../constants/urlRedirectSettings';

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

  return <Fragment>{children}</Fragment>;
};

export default UrlRedirectProvider;

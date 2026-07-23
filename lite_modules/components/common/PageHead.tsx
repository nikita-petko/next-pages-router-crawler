import Head from 'next/head';
import { memo } from 'react';

import { TranslationNamespace } from '@constants/localization';
import { defaultPageTitle, defaultPageTitleKey } from '@constants/navigation';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { usePage } from '@hooks/usePage';

const PageTitle = memo(() => {
  const { pageTitle } = usePage();
  const { translate: translateMetadata } = useNamespacedTranslation(TranslationNamespace.Metadata);
  const { translate: translateNavigation } = useNamespacedTranslation(
    TranslationNamespace.Navigation,
  );
  const translatedDefaultPageTitle = translateNavigation(defaultPageTitleKey);
  const localizedPageTitle =
    pageTitle === defaultPageTitle ? translatedDefaultPageTitle || defaultPageTitle : pageTitle;

  const ogTitle = translateMetadata('OpenGraph.SiteTitle');
  const ogDescription = translateMetadata('OpenGraph.SiteDescription');

  return (
    <Head>
      <title>{localizedPageTitle}</title>
      <meta content={ogDescription} name='description' />
      <meta content={ogTitle} property='og:title' />
      <meta content={ogDescription} property='og:description' />
      <link href={`${process.env.assetPathPrefix}/favicon_48x48.ico`} rel='icon' type='image/png' />
      <meta content='minimum-scale=1, initial-scale=1, width=device-width' name='viewport' />
    </Head>
  );
});

export default PageTitle;

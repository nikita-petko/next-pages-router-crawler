import type { FunctionComponent } from 'react';
import React from 'react';
import { HubMeta } from '@rbx/creator-hub-history';
import type { Locale } from '@rbx/intl';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTheme } from '@rbx/ui';
import { TranslationNamespace } from '../../localization';
import { luobuOpenGraphImagePath, globalOpenGraphImagePath } from '../constants/assetConstants';

export type OpenGraphMetaProps = {
  defaultLocale: Locale;
  title: string;
  description: string;
};

type PageHeadProps = {
  openGraphMetadata: OpenGraphMetaProps;
};

const imagePath =
  process.env.buildTarget === 'luobu' ? luobuOpenGraphImagePath : globalOpenGraphImagePath;

const PageHead: FunctionComponent<React.PropsWithChildren<PageHeadProps>> = ({
  openGraphMetadata: { title, description, defaultLocale },
}) => {
  const { translate } = useTranslation();
  const ogImageUrl = new URL(imagePath, process.env.hostDomain).href;
  const theme = useTheme();

  return (
    <HubMeta
      seoTitle={translate('Label.CreatorDashboard')}
      ogTitle={title}
      description={description}
      ogImage={ogImageUrl}>
      <link
        rel='icon'
        type='image/svg+xml'
        href={`https://cdn.foundation.${process.env.robloxSiteDomain}/current/roblox-tilt/favicon.svg`}
      />
      <link
        rel='icon'
        href={`https://cdn.foundation.${process.env.robloxSiteDomain}/current/roblox-tilt/favicon.ico`}
        sizes='48x48'
      />
      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href={`https://cdn.foundation.${process.env.robloxSiteDomain}/current/roblox-tilt/apple-touch-icon.png`}
      />
      {/* NOTE(@zwang, 05/11/26): `site.webmanifest` is checked in but isn't enabled yet, requires infra level solution  */}
      {/* <link rel="manifest" href="/site.webmanifest" /> */}
      <meta name='theme-color' content={theme.palette.surface[0]} key='theme-color' />
      <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
      <meta name='zd-site-verification' content='8ou4bshfpgbc1pk5x0qqt' />
      <meta property='og:url' content={process.env.hostDomain} key='og:url' />
      <meta property='og:type' content='website' key='og:type' />
      <meta property='og:locale' content={defaultLocale} key='og:locale' />
    </HubMeta>
  );
};

export default withTranslation(PageHead, [TranslationNamespace.Features]);

import React, { FunctionComponent } from 'react';
import { Locale, useTranslation, withTranslation } from '@rbx/intl';
import { useTheme } from '@rbx/ui';
import { HubMeta } from '@rbx/creator-hub-history';
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
        type='image/x-icon'
        href={`https://cdn.foundation.${process.env.robloxSiteDomain}/current/RobloxStudio.ico`}
      />
      <link rel='apple-touch-icon' href={`${process.env.assetPathPrefix}/apple_touch_icon.png`} />
      <link
        // eslint-disable-next-line react/no-invalid-html-attribute -- apple-touch-icon-precomposed is a valid attribute
        rel='apple-touch-icon-precomposed'
        href={`${process.env.assetPathPrefix}/apple_touch_icon.png`}
      />
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

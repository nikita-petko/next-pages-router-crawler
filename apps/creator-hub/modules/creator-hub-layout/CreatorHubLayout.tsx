import React, { PropsWithChildren, useCallback } from 'react';
import {
  CreatorHubLayout as CreatorHubLayoutBase,
  REQUIRED_TRANSLATION_NAMESPACES,
} from '@rbx/creator-hub-navigation';
import { useTranslation, withTranslation } from '@rbx/intl';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceNavigationProvider from '@modules/experience-navigation/providers/ExperienceNavigationProvider';
import { CookieConsentBanner } from '@rbx/cookie-banner';
import { Label, Typography, Grid } from '@rbx/ui';
import AppBreadcrumbs from '@modules/navigation/layout/components/AppBreadcrumbs';
import PrivacyChoicesFooterLink from '@modules/navigation/components/PrivacyChoicesFooterLink';
import dynamic from 'next/dynamic';
import CreatorWorkspaceContainer from './CreatorWorkspaceContainer';

const PrivacyChoicesFooterLinkDynamic = dynamic(() => Promise.resolve(PrivacyChoicesFooterLink), {
  ssr: false,
});

export type TCreatorHubLayoutProps = {
  title?: React.ReactNode | string;
  beta?: boolean;
  secondaryRail?: React.ReactNode;
  useBreadcrumbs?: boolean;
  secondarySize?: 'large' | 'small';
  omitPageTitle?: boolean;
};

const CreatorHubLayout: React.FunctionComponent<PropsWithChildren<TCreatorHubLayoutProps>> = ({
  title,
  beta = false,
  secondaryRail,
  useBreadcrumbs = false,
  secondarySize = 'small',
  omitPageTitle = false,
  children,
}) => {
  const { open, dialog } = useStudio();
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const openStudio = useCallback(() => {
    open({ task: EStudioTaskType.Default });
  }, [open]);

  const pageTitle =
    typeof title === 'string' ? (
      <h1 className='text-heading-large margin-none'>{translate(title)}</h1>
    ) : (
      title
    );

  return (
    <ExperienceNavigationProvider>
      <CreatorHubLayoutBase>
        <CreatorWorkspaceContainer />
        {dialog}
        <CreatorHubLayoutBase.Rail openStudio={openStudio} secondarySize={secondarySize}>
          {secondaryRail}
        </CreatorHubLayoutBase.Rail>
        <CreatorHubLayoutBase.Header>
          {useBreadcrumbs ? (
            <AppBreadcrumbs inLayoutHeader />
          ) : (
            <Grid container alignItems='center' gap='8px'>
              {pageTitle}
              {beta && (
                <Typography>
                  <Label labelText={translate('Label.Beta')} />
                </Typography>
              )}
            </Grid>
          )}
        </CreatorHubLayoutBase.Header>
        <CreatorHubLayoutBase.PageContent
          additionalLinks={
            settings.enableGPCFooter ? <PrivacyChoicesFooterLinkDynamic inline /> : undefined
          }>
          <div>
            {useBreadcrumbs && ((!omitPageTitle && pageTitle) || beta) && (
              <div className='flex items-center gap-small padding-bottom-large'>
                {!omitPageTitle && pageTitle}
                {beta && (
                  <Typography>
                    <Label labelText={translate('Label.Beta')} />
                  </Typography>
                )}
              </div>
            )}
            {children}
            <CookieConsentBanner />
          </div>
        </CreatorHubLayoutBase.PageContent>
      </CreatorHubLayoutBase>
    </ExperienceNavigationProvider>
  );
};

export default withTranslation(CreatorHubLayout, [
  ...REQUIRED_TRANSLATION_NAMESPACES,
  TranslationNamespace.RightsPortal,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.Passes,
  TranslationNamespace.Creations,
  TranslationNamespace.PageTitles,
  TranslationNamespace.Features,
  TranslationNamespace.Privacy,
  TranslationNamespace.Error,
  TranslationNamespace.Analytics,
]);

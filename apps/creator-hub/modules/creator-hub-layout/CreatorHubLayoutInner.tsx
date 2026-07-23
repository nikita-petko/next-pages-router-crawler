import type { PropsWithChildren } from 'react';
import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CookieConsentBanner } from '@rbx/cookie-banner';
import {
  CreatorHubLayout as CreatorHubLayoutBase,
  REQUIRED_TRANSLATION_NAMESPACES,
} from '@rbx/creator-hub-navigation';
import { Translate, useTranslation, withTranslation } from '@rbx/intl';
import { Label, Typography, Grid } from '@rbx/ui';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PrivacyChoicesFooterLink from '@modules/navigation/components/PrivacyChoicesFooterLink';
import AppBreadcrumbs from '@modules/navigation/layout/components/AppBreadcrumbs';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import CreatorWorkspaceContainer from './CreatorWorkspaceContainer';
export const SCROLL_CONTAINER_ID = 'applayout-scroll-container';

const PrivacyChoicesFooterLinkDynamic = dynamic(() => Promise.resolve(PrivacyChoicesFooterLink), {
  ssr: false,
});

export type TCreatorHubLayoutInnerProps = {
  title?: React.ReactNode | string;
  beta?: boolean;
  secondaryRail?: React.ReactNode;
  pageBanner?: React.ReactNode;
  useBreadcrumbs?: boolean;
  secondarySize?: 'large' | 'small';
  omitPageTitle?: boolean;
};

const CreatorHubLayoutInner: React.FunctionComponent<
  PropsWithChildren<TCreatorHubLayoutInnerProps>
> = ({
  title,
  beta = false,
  secondaryRail,
  pageBanner,
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

  const isTranslateElement = React.isValidElement(title) && title.type === Translate;

  const pageTitle =
    typeof title === 'string' ? (
      <h1 className='text-heading-large margin-none'>{translate(title)}</h1>
    ) : isTranslateElement ? (
      <h1 className='text-heading-large margin-none'>{title}</h1>
    ) : (
      (title ?? null)
    );

  return (
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
        id={SCROLL_CONTAINER_ID}
        banner={pageBanner}
        additionalLinks={
          settings.enableGPCFooter ? <PrivacyChoicesFooterLinkDynamic inline /> : undefined
        }>
        <div className='width-full height-full'>
          {useBreadcrumbs && ((!omitPageTitle && pageTitle) ?? beta) && (
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
  );
};

export default withTranslation(CreatorHubLayoutInner, [
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
  TranslationNamespace.TalentHubV2,
  TranslationNamespace.Licenses,
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.RevenueShareAgreements,
  TranslationNamespace.TaxDocumentation,
]);

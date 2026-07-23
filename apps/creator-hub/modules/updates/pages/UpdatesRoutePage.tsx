import React, { ReactNode, useEffect } from 'react';
import { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import LandingHead from '@modules/landing/sections/components/LandingHead';
import { AlertAnnouncementRedesignVariants, IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageNotFound } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import { withTranslation } from '@rbx/intl';
import UpdatesPage from '../Updates';
import { captureUpdatesPageView, EUpdatesPageSection } from '../eventUtils';
import { metadataTitle, metadataDescription, updatesOGImg } from '../metadata';

const getUpdatesLayout = (page: ReactNode) => (
  <IALayoutExperiment product='Home' title='Heading.Updates' noBreadCrumbs>
    <LandingHead />
    {page}
  </IALayoutExperiment>
);

const UpdatesRoutePage: NextLayoutPage = () => {
  const router = useRouter();
  const { isFetched, params: ixpParams } = useIXPParameters(IXPLayers.CreatorHubHomePage, {
    cacheOnly: true,
  });
  const alertAnnouncementRedesign = ixpParams.AlertAnnouncementRedesign;
  const isLegacyAlertsAndAnnouncement =
    alertAnnouncementRedesign === AlertAnnouncementRedesignVariants.LegacyAlertsAndAnnouncement;
  const shouldShowUpdatesPage = !isLegacyAlertsAndAnnouncement && alertAnnouncementRedesign != null;

  let updatesPageLayoutType = 'updatesPageLayoutLegacy';
  if (alertAnnouncementRedesign === AlertAnnouncementRedesignVariants.AlertAndAnnouncement) {
    updatesPageLayoutType = 'updatesPageLayoutNewWithAlert';
  } else if (alertAnnouncementRedesign === AlertAnnouncementRedesignVariants.AnnouncementOnly) {
    updatesPageLayoutType = 'updatesPageLayoutNewWithoutAlert';
  }

  useEffect(() => {
    if (isFetched && shouldShowUpdatesPage) {
      captureUpdatesPageView(updatesPageLayoutType, EUpdatesPageSection.UpdatesPageView);
    }
  }, [isFetched, shouldShowUpdatesPage, updatesPageLayoutType]);

  if (!isFetched && alertAnnouncementRedesign === undefined) {
    return <PageLoading />;
  }

  if (!shouldShowUpdatesPage) {
    return <PageNotFound />;
  }

  const isRoadmap = router.asPath.split('?')[0].endsWith('/roadmap');

  return (
    <React.Fragment>
      <Head>
        <title>{isRoadmap ? `Roadmap - ${metadataTitle}` : metadataTitle}</title>
        <meta
          property='og:title'
          content={isRoadmap ? 'Roblox Creator Roadmap' : metadataTitle}
          key='og:title'
        />
        <meta property='og:description' content={metadataDescription} key='og:description' />
        <meta property='og:image' content={updatesOGImg} key='og:image' />
        <meta name='description' content={metadataDescription} key='description' />
      </Head>
      <UpdatesPage />
    </React.Fragment>
  );
};

const UpdatesRoutePageWithTranslation = withTranslation(UpdatesRoutePage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.RoadMap,
]) as NextLayoutPage;

UpdatesRoutePageWithTranslation.getPageLayout = getUpdatesLayout;

export default UpdatesRoutePageWithTranslation;

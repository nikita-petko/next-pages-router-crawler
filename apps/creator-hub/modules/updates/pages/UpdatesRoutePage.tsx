import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LandingHead from '@modules/landing/sections/components/LandingHead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { captureUpdatesPageView, EUpdatesPageSection } from '../eventUtils';
import { metadataTitle, metadataDescription, updatesOGImg } from '../metadata';
import UpdatesPage from '../Updates';

export const getUpdatesLayout = (page: ReactNode) => (
  <CreatorHubLayout
    product='Home'
    title={<Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Updates' />}
    noBreadCrumbs>
    <LandingHead />
    {page}
  </CreatorHubLayout>
);

const UPDATES_PAGE_VIEW_EVENT = 'updatesPageLayoutNewWithAlert';

const UpdatesRoutePage = () => {
  const router = useRouter();

  useEffect(() => {
    captureUpdatesPageView(UPDATES_PAGE_VIEW_EVENT, EUpdatesPageSection.UpdatesPageView);
  }, []);

  const isRoadmap = router.asPath.split('?')[0].endsWith('/roadmap');

  return (
    <>
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
    </>
  );
};

const UpdatesRoutePageWithTranslation = withTranslation(UpdatesRoutePage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.RoadMap,
]);

export default UpdatesRoutePageWithTranslation;

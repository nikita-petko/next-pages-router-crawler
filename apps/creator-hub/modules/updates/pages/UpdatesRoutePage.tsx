import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { withTranslation, useTranslation } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LandingHead from '@modules/landing/sections/components/LandingHead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { captureUpdatesPageView, EUpdatesPageSection } from '../eventUtils';
import { metadataTitle, metadataDescription, updatesOGImg } from '../metadata';
import UpdatesPage from '../Updates';
import UpdatesLeftRail, {
  UPDATES_NAVIGATION_NAMESPACES,
  useUpdatesNavigation,
} from '../UpdatesLeftRail';

const UpdatesHeading = () => {
  const { translateWithNamespace } = useTranslation();
  const { activeItem } = useUpdatesNavigation();

  return (
    <h1 className='text-heading-large margin-none'>
      {activeItem?.label ??
        translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Updates')}
    </h1>
  );
};

const UpdatesPageTitle = withTranslation(UpdatesHeading, UPDATES_NAVIGATION_NAMESPACES);

export const getUpdatesLayout = (page: ReactNode) => (
  <CreatorHubLayout
    product='Home'
    title={<UpdatesPageTitle />}
    noBreadCrumbs
    secondaryRail={<UpdatesLeftRail />}
    secondarySize='small'>
    <LandingHead />
    {page}
  </CreatorHubLayout>
);

const UPDATES_PAGE_VIEW_EVENT = 'updatesPageLayoutNewWithAlert';

const UpdatesRoutePage = () => {
  const router = useRouter();
  const { translateWithNamespace } = useTranslation();

  useEffect(() => {
    captureUpdatesPageView(UPDATES_PAGE_VIEW_EVENT, EUpdatesPageSection.UpdatesPageView);
  }, []);

  const isRoadmap = router.asPath.split('?')[0].endsWith('/roadmap');

  return (
    <>
      <Head>
        <title>
          {isRoadmap
            ? translateWithNamespace(TranslationNamespace.RoadMap, 'Heading.RoadmapDocumentTitle')
            : metadataTitle}
        </title>
        <meta
          property='og:title'
          content={
            isRoadmap
              ? translateWithNamespace(TranslationNamespace.RoadMap, 'Heading.RoadmapOgTitle')
              : metadataTitle
          }
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

import React, { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';
import { AlertAnnouncementRedesignVariants, IXPLayers } from '@modules/clients/ixpExperiments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { PageLoading } from '@modules/miscellaneous/common';
import { HubMeta } from '@rbx/creator-hub-history';
import RoadMapContainer from '@modules/roadMap/RoadMapContainer';
import {
  metadataDescription,
  metadataTitle,
  roadMapOGImg,
} from '@modules/roadMap/constants/roadMapConstants';

const RoadMap: NextLayoutPage = () => {
  const router = useRouter();
  const { translate, ready } = useTranslation();
  const { isFetched, params: ixpParams } = useIXPParameters(IXPLayers.CreatorHubHomePage, {
    cacheOnly: true,
  });
  const alertAnnouncementRedesign = ixpParams.AlertAnnouncementRedesign;
  const isLegacyAlertsAndAnnouncement =
    alertAnnouncementRedesign === AlertAnnouncementRedesignVariants.LegacyAlertsAndAnnouncement;
  const shouldRedirectToUpdatesRoadmap =
    !isLegacyAlertsAndAnnouncement && alertAnnouncementRedesign != null;

  useEffect(() => {
    if (isFetched && shouldRedirectToUpdatesRoadmap) {
      router.replace('/updates/roadmap');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit to avoid unnecessary effect runs
  }, [isFetched, shouldRedirectToUpdatesRoadmap]);

  if (!isFetched && alertAnnouncementRedesign === undefined) {
    return <PageLoading />;
  }
  if (shouldRedirectToUpdatesRoadmap) {
    return <PageLoading />;
  }

  return (
    <React.Fragment>
      <HubMeta
        title={translate('Heading.CreatorRoadMap')}
        seoTitle={metadataTitle}
        ogTitle={translate('Heading.RobloxCreatorRoadmap')}
        description={metadataDescription}
        ogImage={roadMapOGImg}
      />
      <BasicLayout isReady={ready} product='RoadMap'>
        <RoadMapContainer />
      </BasicLayout>
    </React.Fragment>
  );
};

export default withTranslation(RoadMap, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.RoadMap,
]);

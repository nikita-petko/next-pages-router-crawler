import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Translate } from '@rbx/intl';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import Authenticated from '@modules/authentication/Authenticated';
import CreationsIALeftNav from '@modules/creations/common/components/CreationsIALeftNav';
import useEnableCreationsNavLayout from '@modules/creations/common/hooks/useEnableCreationsNavLayout';
import useEnablePublishingConsolidation from '@modules/creations/common/hooks/useEnablePublishingConsolidation';
import DevelopmentItemsBreadcrumbs from '@modules/creations/contentManager/developmentItems/components/DevelopmentItemsBreadcrumbs';
import { isDevelopmentItemAsset } from '@modules/creations/contentManager/developmentItems/developmentItemsInventoryUtils';
import CreationsMetadataContainer from '@modules/creations/home/containers/CreationsMetadataContainer';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { Asset } from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

const getActiveTab = (value: string | string[] | undefined): Asset => {
  const activeTab = Array.isArray(value) ? value[0] : value;
  return activeTab != null && isValidEnumValue(Asset, activeTab) ? activeTab : Asset.MyExperiences;
};

const CreationsPageLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const shouldUseCreationsNavLayout = useEnableCreationsNavLayout();
  const enablePublishingConsolidation = useEnablePublishingConsolidation();
  const showPublishingConsolidation =
    enablePublishingConsolidation && isDevelopmentItemAsset(getActiveTab(router.query.activeTab));

  return (
    <CreatorHubLayout
      title={
        showPublishingConsolidation ? (
          <DevelopmentItemsBreadcrumbs />
        ) : (
          <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Creations' />
        )
      }
      secondaryRail={shouldUseCreationsNavLayout ? <CreationsIALeftNav /> : undefined}
      secondarySize={shouldUseCreationsNavLayout ? 'small' : undefined}
      noBreadCrumbs>
      <CreateAssetFormProvider>{children}</CreateAssetFormProvider>
    </CreatorHubLayout>
  );
};

const getCreationsPageLayout = (page: ReactNode) => (
  <CreationsPageLayout>{page}</CreationsPageLayout>
);

const Creations: NextLayoutPage = () => {
  return (
    <Authenticated>
      <VerificationMetadataProvider>
        <AffiliateProgramProvider>
          <CreationsMetadataContainer />
        </AffiliateProgramProvider>
      </VerificationMetadataProvider>
    </Authenticated>
  );
};

Creations.getPageLayout = getCreationsPageLayout;
Creations.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Creations;

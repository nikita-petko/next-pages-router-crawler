import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { NextLayoutPage } from 'next';
import { useTranslation } from '@rbx/intl';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import Authenticated from '@modules/authentication/Authenticated';
import CreationsIALeftNav, {
  useCreationsNavigation,
} from '@modules/creations/common/components/CreationsIALeftNav';
import CreatorContextResolutionContext from '@modules/creations/common/contexts/CreatorContextResolutionContext';
import CreationsMetadataContainer from '@modules/creations/home/containers/CreationsMetadataContainer';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import useSyncCreatorContextFromQuery from '@modules/transactions/hooks/useSyncCreatorContextFromQuery';

const CreationsPageTitle = () => {
  const { translate } = useTranslation();
  const { activeItem } = useCreationsNavigation();

  return (
    <h1 className='text-heading-large margin-none'>
      {activeItem?.label ?? translate('Heading.Creations')}
    </h1>
  );
};

const CreationsPageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <CreatorHubLayout
      title={<CreationsPageTitle />}
      secondaryRail={<CreationsIALeftNav />}
      secondarySize='small'
      noBreadCrumbs>
      <CreateAssetFormProvider>{children}</CreateAssetFormProvider>
    </CreatorHubLayout>
  );
};

const getCreationsPageLayout = (page: ReactNode) => (
  <CreationsPageLayout>{page}</CreationsPageLayout>
);

const Creations: NextLayoutPage = () => {
  // Honors a `?groupId=<id>` or `?userId=<id>` deep link by switching the active creator, and strips the
  // param once it settles. Studio's publish settings link carries the creator this way. Mounted here
  // rather than in the toolbar because the toolbar does not render on every tab, and the page renders
  // straight away so the switch does not gate anything else loading.
  const { isResolving: isResolvingCreatorContext } = useSyncCreatorContextFromQuery();
  const creatorContextResolution = useMemo(
    () => ({ isResolving: isResolvingCreatorContext }),
    [isResolvingCreatorContext],
  );

  return (
    <Authenticated>
      <VerificationMetadataProvider>
        <AffiliateProgramProvider>
          {/* Read by CreationsToolbar, which holds the publish settings modal shut until the switch
              lands. Opening earlier would show the previous creator's values and let Save write them
              as this creator's. */}
          <CreatorContextResolutionContext.Provider value={creatorContextResolution}>
            <CreationsMetadataContainer />
          </CreatorContextResolutionContext.Provider>
        </AffiliateProgramProvider>
      </VerificationMetadataProvider>
    </Authenticated>
  );
};

Creations.getPageLayout = getCreationsPageLayout;
Creations.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Creations;

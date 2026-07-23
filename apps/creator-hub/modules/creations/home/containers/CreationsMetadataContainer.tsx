import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import type { Asset } from '@modules/miscellaneous/common';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import FiltersProvider from '../../common/components/CreationsFiltersProvider';
import { getAllowedMarketplaceItemTypes } from '../../menu/constants/MenuConstants';
import useVerificationMetadata from '../../verification/hooks/useVerificationMetadata';
import CreationsContainer from './CreationsContainer';

const CreationsMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const verificationMetadata = useVerificationMetadata();

  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset> | undefined>(undefined);

  useEffect(() => {
    void getAllowedMarketplaceItemTypes().then(({ assetTypes }) => {
      setAllowedAssetTypes(assetTypes);
    });
  }, []);

  return (
    <FiltersProvider>
      <CreationsContainer
        verificationMetadata={verificationMetadata}
        currentGroup={currentGroup}
        currentUser={user}
        allowedAssetTypes={allowedAssetTypes}
      />
    </FiltersProvider>
  );
};

export default CreationsMetadataContainer;

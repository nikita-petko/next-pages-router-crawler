import React, { FunctionComponent, useEffect, useState } from 'react';
import { Asset, PageLoading } from '@modules/miscellaneous/common';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useAuthentication } from '@modules/authentication/providers';
import { getAllowedAssetTypes } from '../../menu/constants/MenuConstants';
import { FiltersProvider } from '../../common';
import { useVerificationMetadata } from '../../verification';
import CreationsContainer from './CreationsContainer';

const CreationsMetadataContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const verificationMetadata = useVerificationMetadata();

  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset> | undefined>(undefined);

  useEffect(() => {
    const fetchAllowedAssetTypes = async () => {
      // Will use pre-fetched asset types if available, otherwise will fetch from the API
      const fetchedAssetTypes = await getAllowedAssetTypes();
      return fetchedAssetTypes;
    };

    fetchAllowedAssetTypes().then((fetchedAllowedAssetTypes) => {
      setAllowedAssetTypes(fetchedAllowedAssetTypes);
    });
  }, []);

  if (typeof verificationMetadata !== 'undefined' && typeof currentGroup !== 'undefined') {
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
  }
  return <PageLoading />;
};

export default CreationsMetadataContainer;

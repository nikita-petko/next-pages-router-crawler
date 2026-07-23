import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetOrganizationPermissionsByGroupId } from '@modules/react-query/organizations/organizationsQueries';
import { ASSET_ACCESS_FORM_ASSETS } from '../../constants';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import PermissionDeveloperItemWithTabs from './V2Form/PermissionDeveloperItemWithTabs';

const PermissionDeveloperItemContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { canConfigureDeveloperItem, developerItemDetails, isLoadingDeveloperItem } =
    useCurrentDeveloperItem();

  const { data: userPermissions } = useGetOrganizationPermissionsByGroupId(
    developerItemDetails?.creator?.type === CreatorType.Group
      ? developerItemDetails?.creator?.id
      : 0,
  );

  const canConfigureDeveloperItemPermissions = useMemo(() => {
    if (!developerItemDetails) {
      return canConfigureDeveloperItem;
    }
    // NOTE(@rvaughan, 2025-10-16): This call for group permisisons will become unnecessary after asset-permissions-api
    // adds an endpoint to return if a user can configure asset permissions for a given asset.
    return (
      canConfigureDeveloperItem === true || userPermissions?.canManageAssetPermissions === true
    );
  }, [canConfigureDeveloperItem, developerItemDetails, userPermissions?.canManageAssetPermissions]);

  const { user, isFetched } = useAuthentication();
  if (isLoadingDeveloperItem || !isFetched) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }
  if (!developerItemDetails || !ASSET_ACCESS_FORM_ASSETS.includes(developerItemDetails.type)) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!canConfigureDeveloperItemPermissions || !user?.id) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <PermissionDeveloperItemWithTabs developerItemDetails={developerItemDetails} user={user} />
  );
};

export default withTranslation(PermissionDeveloperItemContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Table,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetPermissions,
]);

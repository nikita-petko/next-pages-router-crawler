import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import React, { FunctionComponent, useMemo } from 'react';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useGetOrganizationPermissionsByGroupId } from '@modules/react-query/organizations/organizationsQueries';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import PermissionDeveloperItemForm from './PermissionDeveloperItemForm';
import { PERMISSION_ASSETS_WITH_ANIMATION, PERMISSION_ASSETS } from '../../constants';
import PermissionDeveloperItemWithTabs from './V2Form/PermissionDeveloperItemWithTabs';

const PermissionDeveloperItemContainer: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enablePermissionPageRedesign =
    frontendFlags[FrontendFlagName.FrontendFlagEnablePermissionPageRedesign];
  const enableAnimationPermissionPage =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAnimationPermissionPage];
  const enabledPermissionAssets = enableAnimationPermissionPage
    ? PERMISSION_ASSETS_WITH_ANIMATION
    : PERMISSION_ASSETS;

  const { canConfigureDeveloperItem, developerItemDetails, isLoadingDeveloperItem } =
    useCurrentDeveloperItem();

  const { data: userPermissions } = useGetOrganizationPermissionsByGroupId(
    developerItemDetails?.creator?.type === 'Group' ? developerItemDetails?.creator?.id : 0,
  );

  const canConfigureDeveloperItemPermissions = useMemo(() => {
    if (!developerItemDetails) {
      return canConfigureDeveloperItem;
    }
    // NOTE(@rvaughan, 2025-10-16): This call for group permisisons will become unnecessary after asset-permissions-api
    // adds an endpoint to return if a user can configure asset permissions for a given asset.
    return canConfigureDeveloperItem || userPermissions?.canManageAssetPermissions;
  }, [canConfigureDeveloperItem, developerItemDetails, userPermissions?.canManageAssetPermissions]);

  const { user, isFetched } = useAuthentication();
  if (loadingFrontendFlags || isLoadingDeveloperItem || !isFetched) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }
  if (!developerItemDetails || !enabledPermissionAssets.includes(developerItemDetails.type)) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!canConfigureDeveloperItemPermissions || !user?.id) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return enablePermissionPageRedesign ? (
    <PermissionDeveloperItemWithTabs developerItemDetails={developerItemDetails} user={user} />
  ) : (
    <PermissionDeveloperItemForm developerItemDetails={developerItemDetails} user={user} />
  );
};

export default withTranslation(PermissionDeveloperItemContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Table,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetPermissions,
]);

import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { Alert } from '@rbx/foundation-ui';
import {
  EntityTypes as GroupManagementEntityTypes,
  GroupManagementProvider,
  GroupManagementSurface,
  PermissionsContainer as UnifiedPermissionsContainer,
} from '@rbx/group-management';
import { withTranslation } from '@rbx/intl';
import { useMediaQuery, useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { CreatorType, toastDurationTime } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { PermissionsContainer } from '@modules/permissions/containers/PermissionsContainer';
import { CreatorTypes, EntityTypes } from '@modules/permissions/utils/enums';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  useGetGroupMigrationStatus,
  useGetGroupProductFeatures,
} from '@modules/react-query/groups/groupQueries';

const MIGRATED_STATUS = 'Migrated';

const CollaboratorPermissionsContainer: FunctionComponent = () => {
  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const { isOrganizationLoading, permissions = null, organization } = useCurrentOrganization();
  const router = useRouter();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { user } = useAuthentication();
  const { open: openStudio, dialog } = useStudio();
  const { enqueue, close } = useSnackbar();
  const groupId = organization?.groupId ? Number.parseInt(organization.groupId, 10) : undefined;
  const { data: productFeatures, isLoading: isProductFeaturesLoading } =
    useGetGroupProductFeatures(groupId);

  const isUnifiedUIEnabled = productFeatures?.isUnifiedUIEnabled === true;

  const { data: migrationStatus, isLoading: isMigrationStatusLoading } = useGetGroupMigrationStatus(
    groupId,
    isUnifiedUIEnabled,
  );

  const uiConfig = useMemo(() => {
    return {
      showRevokeAllButton: false,
      showMobileView: isMobile,
      showConfirmationOnSave: false,
    };
  }, [isMobile]);

  const reload = useCallback(() => {
    router.reload();
  }, [router]);

  const group = useMemo(() => ({ id: groupId ?? 0 }), [groupId]);

  const navigateToRole = useCallback(
    (roleId: string) => router.replace(creatorHub.getGroupRoleUrl(roleId)),
    [router],
  );

  const navigation = useMemo(() => ({ currentRoleId: null, navigateToRole }), [navigateToRole]);

  const groupUser = useMemo(() => ({ id: user?.id ?? 0 }), [user]);

  const openStudioFn = useCallback(
    () => openStudio({ task: EStudioTaskType.Default }),
    [openStudio],
  );

  const studio = useMemo(() => ({ open: openStudioFn, dialog }), [openStudioFn, dialog]);

  const showToast = useCallback(
    (message: string, isError?: boolean) => {
      enqueue({
        children: (
          <Alert
            severity={isError ? 'Error' : 'Success'}
            variant='Feedback'
            hasCloseAffordance={false}>
            {message}
          </Alert>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  if (
    isLoadingGame ||
    isOrganizationLoading ||
    (gameDetails?.creator?.type === CreatorType.Group && !permissions) ||
    isMigrationStatusLoading ||
    isProductFeaturesLoading
  ) {
    return <PageLoading />;
  }

  if (isErrorLoadingGame || !gameDetails) {
    return <LoadError onReload={reload} />;
  }

  if (
    gameDetails.creator?.type === CreatorType.Group &&
    !permissions?.isOwner &&
    !permissions?.assignableRoleIds?.length &&
    !permissions?.permissionEditableRoleIds?.length &&
    !permissions?.metadataEditableRoleIds.length
  ) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const universeId = router.query.id as string;
  const entity = {
    id: universeId,
    type: EntityTypes.UNIVERSE,
    name: gameDetails.name,
    owner: gameDetails.creator && {
      id: `${gameDetails.creator.id ?? ''}`,
      name: gameDetails.creator.name ?? '',
      type: gameDetails.creator.type === CreatorType.User ? CreatorTypes.USER : CreatorTypes.GROUP,
      subtext:
        gameDetails.creator.type === CreatorType.User ? `@${gameDetails.creator.name}` : undefined,
    },
  };

  const unifiedEntity = {
    ...entity,
    type: GroupManagementEntityTypes.UNIVERSE,
  };

  const creatorFilter = [CreatorTypes.ROLE, CreatorTypes.USER, CreatorTypes.LEGACY_ROLE];

  if (organization && user && isUnifiedUIEnabled && migrationStatus?.status === MIGRATED_STATUS) {
    return (
      <GroupManagementProvider
        surface={GroupManagementSurface.Creator}
        group={group}
        navigation={navigation}
        user={groupUser}
        showToast={showToast}
        studio={studio}>
        <UnifiedPermissionsContainer
          entity={unifiedEntity}
          creatorFilter={creatorFilter}
          uiConfig={uiConfig}
        />
      </GroupManagementProvider>
    );
  }

  return <PermissionsContainer entity={entity} creatorFilter={creatorFilter} uiConfig={uiConfig} />;
};

export default withTranslation(CollaboratorPermissionsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
]);

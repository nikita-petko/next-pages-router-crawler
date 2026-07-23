import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import {
  EntityTypes as GroupManagementEntityTypes,
  GroupManagementProvider,
  GroupManagementSurface,
  PermissionsContainer as UnifiedPermissionsContainer,
  type GroupManagementErrorComponents,
} from '@rbx/group-management';
import { withTranslation } from '@rbx/intl';
import { useMediaQuery } from '@rbx/ui';
import { isUnifiedUiEnabled } from '@generated/flags/groups';
import { useAuthentication } from '@modules/authentication/providers';
import useBottomToast from '@modules/group/hooks/useBottomToast';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { CreatorType } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { PermissionsContainer } from '@modules/permissions/containers/PermissionsContainer';
import { CreatorTypes, EntityTypes } from '@modules/permissions/utils/enums';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useGetGroupMigrationStatus } from '@modules/react-query/groups/groupQueries';

const MIGRATED_STATUS = 'Migrated';

const CollaboratorPermissionsContainer: FunctionComponent = () => {
  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const { isOrganizationLoading, permissions = null, organization } = useCurrentOrganization();
  const router = useRouter();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { user } = useAuthentication();
  const { open: openStudio, dialog } = useStudio();
  const { showBottomToast } = useBottomToast();
  const groupId = organization?.groupId ? Number.parseInt(organization.groupId, 10) : undefined;
  const { data: migrationStatus, isLoading: isMigrationStatusLoading } =
    useGetGroupMigrationStatus(groupId);
  // oxlint-disable-next-line react/react-compiler
  const { value: isUnifiedUIEnabled } = useFlag(isUnifiedUiEnabled);

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
      showBottomToast(message, { severity: isError ? 'error' : 'success' });
    },
    [showBottomToast],
  );

  const errorComponents = useMemo<GroupManagementErrorComponents>(
    () => ({ loadErrorComponent: () => <LoadError onReload={reload} /> }),
    [reload],
  );

  if (
    isLoadingGame ||
    isOrganizationLoading ||
    (gameDetails?.creator?.type === CreatorType.Group && !permissions) ||
    isMigrationStatusLoading
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
        studio={studio}
        errorComponents={errorComponents}>
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

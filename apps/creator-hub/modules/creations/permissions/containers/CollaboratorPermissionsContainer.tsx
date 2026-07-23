import { FunctionComponent, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import { useMediaQuery } from '@rbx/ui';
import { PermissionsContainer } from '@modules/permissions/containers/PermissionsContainer';
import { CreatorTypes, EntityTypes } from '@modules/permissions/utils/enums';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { CreatorType, PageLoading } from '@modules/miscellaneous/common';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';

const CollaboratorPermissionsContainer: FunctionComponent = () => {
  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const { isOrganizationLoading, permissions = null } = useCurrentOrganization();
  const router = useRouter();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const uiConfig = useMemo(() => {
    return {
      showRevokeAllButton: false,
      showMobileView: isMobile,
      showConfirmationOnSave: false,
    };
  }, [isMobile]);

  const reload = () => {
    router.reload();
  };

  if (
    isLoadingGame ||
    isOrganizationLoading ||
    (gameDetails?.creator?.type === CreatorType.Group && !permissions)
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

  const universeId = router.query.id as string;
  const entity = {
    id: universeId,
    type: EntityTypes.UNIVERSE,
    name: gameDetails.name,
    owner: gameDetails.creator && {
      id: `${gameDetails.creator.id ?? ''}`,
      name: `${gameDetails.creator.name ?? ''}`,
      type: gameDetails.creator.type === CreatorType.User ? CreatorTypes.USER : CreatorTypes.GROUP,
      subtext:
        gameDetails.creator.type === CreatorType.User ? `@${gameDetails.creator.name}` : undefined,
    },
  };

  const creatorFilter = [CreatorTypes.ROLE, CreatorTypes.USER, CreatorTypes.LEGACY_ROLE];

  return <PermissionsContainer entity={entity} creatorFilter={creatorFilter} uiConfig={uiConfig} />;
};

export default withTranslation(CollaboratorPermissionsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
]);

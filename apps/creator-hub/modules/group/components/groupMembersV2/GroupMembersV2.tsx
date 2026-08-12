import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import Router from 'next/router';
import type { RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { ProgressCircle, Alert } from '@rbx/foundation-ui';
import {
  GroupInviteButton as UnifiedGroupInviteButton,
  GroupManagementProvider,
  GroupManagementSurface,
  GroupMembersMenu as UnifiedGroupMembersMenu,
  GroupMembersTable as UnifiedGroupMembersTable,
} from '@rbx/group-management';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import { useGetOrganizationRoles } from '@modules/react-query/groupMembers';
import {
  useGetGroupMigrationStatus,
  useGetGroupProductFeatures,
} from '@modules/react-query/groups/groupQueries';
import {
  DefaultMemberRoleId,
  GroupMembersMenuState,
  InviteQueryKey,
  MigratedGroupStatus,
} from '../../constants/groupConstants';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import GroupRolesMenu from '../GroupRolesMenu';
import MaintenanceBanner from '../MaintenanceBanner';
import GroupInviteButtonV2 from './GroupInviteButtonV2';
import GroupMembersMenu from './GroupMembersMenu';
import LegacyGroupMembersTable from './GroupMembersTableV2';

const useStyles = makeStyles()((theme) => ({
  container: {
    gap: 8,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inviteRowContainer: {
    gap: 16,
    paddingTop: 16,
  },
}));

const GroupMembers: FunctionComponent = () => {
  const { translate } = useTranslation();
  const {
    classes: { container, inviteRowContainer },
  } = useStyles();

  const { organization, permissions } = useCurrentOrganization();
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { enqueue, close } = useSnackbar();
  const { data: roles } = useGetOrganizationRoles(organization?.id);
  const groupId = organization?.groupId ? Number.parseInt(organization.groupId, 10) : undefined;
  const { data: productFeatures, isLoading: isProductFeaturesLoading } =
    useGetGroupProductFeatures(groupId);

  const isUnifiedUIEnabled = productFeatures?.isUnifiedUIEnabled === true;

  const { data: migrationStatus, isLoading: isMigrationStatusLoading } = useGetGroupMigrationStatus(
    groupId,
    isUnifiedUIEnabled,
  );

  const [menuState, setMenuState] = useState(GroupMembersMenuState.Members);
  const [roleFilter, setRoleFilter] = useState<RoleMetadata | null>(null);

  const effectiveRoleFilter = useMemo(
    () => roleFilter ?? roles?.find((role) => role.id === DefaultMemberRoleId) ?? null,
    [roleFilter, roles],
  );

  const groupProp = useMemo(() => ({ id: groupId ?? 0 }), [groupId]);
  const userProp = useMemo(() => ({ id: user?.id ?? 0 }), [user?.id]);
  const getUserProfileUrl = useCallback((userId: number) => www.getUserUrl(userId), []);
  const navigateToRole = useCallback(
    (roleId: string) => Router.replace(creatorHub.getGroupRoleUrl(roleId)),
    [],
  );
  const getInvitationLinkUrl = useCallback(
    (organizationId: string) =>
      `https://create.${process.env.robloxSiteDomain}/dashboard/group/members?${InviteQueryKey}=${organizationId}`,
    [],
  );
  const navigationProp = useMemo(
    () => ({ currentRoleId: null, navigateToRole, getUserProfileUrl, getInvitationLinkUrl }),
    [navigateToRole, getUserProfileUrl, getInvitationLinkUrl],
  );
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

  if (!organization || isMigrationStatusLoading || isProductFeaturesLoading) {
    return (
      <Grid container justifyContent='center'>
        <ProgressCircle ariaLabel={translate('Label.Loading')} />
      </Grid>
    );
  }

  return (
    <Grid container className={container}>
      <HubMeta
        title={buildTitle(translate('Heading.Members'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Members'))}
      />
      <MaintenanceBanner />
      {isUnifiedUIEnabled && migrationStatus?.status === MigratedGroupStatus ? (
        <GroupManagementProvider
          surface={GroupManagementSurface.Creator}
          group={groupProp}
          navigation={navigationProp}
          user={userProp}
          showToast={showToast}
          unifiedLogger={unifiedLogger}>
          <UnifiedGroupMembersMenu menuState={menuState} onMenuStateChange={setMenuState} />
          <UnifiedGroupMembersTable
            menuState={menuState}
            toolbarStart={<UnifiedGroupInviteButton />}
            emptyStateAction={<UnifiedGroupInviteButton />}
          />
        </GroupManagementProvider>
      ) : (
        <>
          {permissions?.canManageMembers && (
            <GroupMembersMenu menuState={menuState} onMenuStateChange={setMenuState} />
          )}
          <Grid container direction='row' className={inviteRowContainer}>
            {permissions?.canManageMembers && <GroupInviteButtonV2 />}
            <GroupRolesMenu value={effectiveRoleFilter} onSelect={setRoleFilter} />
          </Grid>
          <LegacyGroupMembersTable menuState={menuState} roleFilter={effectiveRoleFilter} />
        </>
      )}
    </Grid>
  );
};

export default GroupMembers;

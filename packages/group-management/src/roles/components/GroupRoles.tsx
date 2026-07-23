import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  useMediaQuery,
  Button,
  NavigateBeforeIcon,
  ChevronRightIcon,
  useTheme,
} from '@rbx/ui';
import type { GroupRoleMetadata } from '../../clients/groups';
import TranslationNamespace from '../../constants/TranslationNamespace';
import useCanAssignRoles from '../../hooks/useCanAssignRoles';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { PermissionsContainer } from '../../permissions/containers/PermissionsContainer';
import { CreatorTypes, EntityTypes } from '../../permissions/utils/types';
import type { CreatorDetails, EntityDetails } from '../../permissions/utils/types';
import {
  useCreateRole,
  useDeleteRole,
  useGetGroupsRoles,
  useUpdateRoleMetadata,
} from '../../queries/rolesQueries';
import {
  DefaultMemberRoleIdNumber,
  DefaultNewRoleRank,
  GuestRoleRank,
} from '../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import { getRandomRoleColorType, getRoleStyle } from '../../utils/groupUtils';
import { ConfigureRoleTab } from '../../utils/types';
import type { RoleCreationMetadata, RoleMetadataForNewRole } from '../../utils/types';
import CreateRoleModal from './CreateRoleModal';
import RoleMembers from './RoleMembers';
import RoleSettings from './RoleSettings';
import RolesSidebar from './RolesSidebar';

const CONFIGURE_ROLE_TABS: ConfigureRoleTab[] = [
  ConfigureRoleTab.Permissions,
  ConfigureRoleTab.Members,
  ConfigureRoleTab.Settings,
];

const useGroupRolesStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },
  innerContainer: {
    gap: '16px',
  },
  horizontalDivider: {
    marginTop: 4,
    color: theme.palette.components.divider,
    width: '100%',
  },
  verticalDivider: {
    flex: '0 0 auto',
    margin: '0px 16px',
    color: theme.palette.components.divider,
    height: '100%',
    border: `1px solid ${theme.palette.components.divider}`,
  },
  tabContent: {
    flex: '2',
    minWidth: 0,
  },
  column: {
    flex: '1',
    minWidth: 0,
    maxWidth: '216px',
  },
  roleButton: {
    span: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
    },
  },
  beforeButton: {
    padding: '8px 5px',
  },
}));

export type GroupRolesProps = {
  disabled?: boolean;
};

const GroupRoles: FunctionComponent<React.PropsWithChildren<GroupRolesProps>> = ({
  disabled = false,
}) => {
  const { translate, translateWithNamespace } = useTranslation();
  const { palette } = useTheme();
  const { organization, permissions, refreshPermission, unifiedLogger, navigation, showToast } =
    useCurrentGroup();
  const { isUnrestricted } = useCanAssignRoles();

  const roleId = Number.parseInt(navigation?.currentRoleId ?? '0', 10);

  const {
    classes: {
      container,
      innerContainer,
      horizontalDivider,
      column,
      roleButton,
      tabContent,
      beforeButton,
    },
  } = useGroupRolesStyles();

  const [isRoleSaving, setIsRoleSaving] = useState<boolean>(false);
  const [localRoles, setLocalRoles] = useState<RoleCreationMetadata[]>();
  const [selectedRole, setSelectedRole] = useState<RoleCreationMetadata>();
  const [selectedTab, setSelectedTab] = useState<ConfigureRoleTab>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const {
    data: fetchedRoles,
    isLoading,
    isError: isErrorFetchingRoles,
  } = useGetGroupsRoles(organization?.groupId);

  const { mutateAsync: updateRoleMetadataAsync } = useUpdateRoleMetadata();
  const { mutateAsync: createRoleAsync } = useCreateRole();
  const { mutate: deleteRole } = useDeleteRole();

  const [prevFetchedRoles, setPrevFetchedRoles] = useState<typeof fetchedRoles | null>(null);
  if (fetchedRoles !== prevFetchedRoles) {
    setPrevFetchedRoles(fetchedRoles);
    if (fetchedRoles) {
      setLocalRoles(fetchedRoles.map((metadata) => ({ metadata, isNewRole: false })));
    }
  }

  if (isErrorFetchingRoles) {
    showToast(translate('Error.GroupRoles'), true);
  }

  const [prevLocalRolesForAutoSelect, setPrevLocalRolesForAutoSelect] = useState(localRoles);
  const [prevAssignableRoleIds, setPrevAssignableRoleIds] = useState(
    permissions?.assignableRoleIds,
  );
  const [pendingNavigationId, setPendingNavigationId] = useState<string | undefined>(undefined);

  const autoSelectInputsChanged =
    prevLocalRolesForAutoSelect !== localRoles ||
    (!isUnrestricted && prevAssignableRoleIds !== permissions?.assignableRoleIds);

  if (
    !isMobile &&
    !selectedRole &&
    localRoles !== undefined &&
    (isUnrestricted || permissions?.assignableRoleIds !== undefined) &&
    autoSelectInputsChanged
  ) {
    setPrevLocalRolesForAutoSelect(localRoles);
    setPrevAssignableRoleIds(permissions?.assignableRoleIds);

    if (isUnrestricted) {
      const role = roleId ? localRoles.find((r) => r.metadata?.id === roleId) : undefined;
      const fallback = localRoles[0];
      if (!role && fallback?.metadata?.id !== undefined) {
        setPendingNavigationId(fallback.metadata.id.toString());
      }
      setSelectedRole(role ?? fallback);
    } else {
      const assignableRoles = localRoles.filter(
        (r) => r.metadata?.id && permissions?.assignableRoleIds?.includes(r.metadata.id.toString()),
      );
      const role = roleId ? assignableRoles.find((r) => r.metadata?.id === roleId) : undefined;
      const fallback = assignableRoles[0];
      if (!role && fallback?.metadata?.id !== undefined) {
        setPendingNavigationId(fallback.metadata.id.toString());
      }
      setSelectedRole(role ?? fallback);
    }

    setSelectedTab(ConfigureRoleTab.Permissions);
  }

  useEffect(() => {
    if (pendingNavigationId !== undefined) {
      navigation?.navigateToRole?.(pendingNavigationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNavigationId]);

  const handleCreateRole = useCallback(
    async (role: RoleMetadataForNewRole) => {
      if (!organization?.id || !role.name || role.color === undefined) {
        return;
      }

      setIsRoleSaving(true);

      try {
        const createRoleResponse = await createRoleAsync({
          groupId: Number.parseInt(organization.groupId, 10),
          name: role.name,
          description: role.description ?? '',
          rank: role.rank ?? DefaultNewRoleRank,
        });

        const roleCreationMetadata: RoleCreationMetadata = {
          metadata: createRoleResponse,
          isNewRole: true,
        };

        setLocalRoles((prevRoles) => {
          if (!prevRoles) {
            return prevRoles;
          }
          const memberIndex = prevRoles.findIndex(
            (r) => r.metadata?.id === DefaultMemberRoleIdNumber,
          );
          const insertIndex = memberIndex >= 0 ? memberIndex + 1 : prevRoles.length;
          return [
            ...prevRoles.slice(0, insertIndex),
            roleCreationMetadata,
            ...prevRoles.slice(insertIndex),
          ];
        });
        setSelectedRole(roleCreationMetadata);
        setSelectedTab(ConfigureRoleTab.Settings);
        void refreshPermission();
        setIsCreateModalOpen(false);
      } catch {
        showToast(
          translateWithNamespace(TranslationNamespace.Organization, 'Error.SavingRoleSettings'),
          true,
        );
      } finally {
        setIsRoleSaving(false);
      }
    },
    [organization, refreshPermission, showToast, translateWithNamespace, createRoleAsync],
  );

  const handleUpdateRoleSettings = useCallback(
    async (role: GroupRoleMetadata) => {
      if (!organization?.id || role.id === undefined || !role.name || role.color === undefined) {
        return;
      }

      setIsRoleSaving(true);

      try {
        const updateRoleMetadataResponse = await updateRoleMetadataAsync({
          groupId: Number.parseInt(organization.groupId, 10),
          rolesetId: role.id,
          name: role.name,
          description: role.description ?? '',
          rank: role.rank ?? DefaultNewRoleRank,
          color: role.color,
        });

        setLocalRoles((prevRoles): RoleCreationMetadata[] | undefined => {
          const newRolesList = prevRoles?.map((prevRole) => {
            if (prevRole?.metadata?.id === role.id) {
              const updatedRole: RoleCreationMetadata = {
                metadata: {
                  ...prevRole.metadata,
                  ...updateRoleMetadataResponse,
                },
                isNewRole: prevRole.isNewRole,
              };
              return updatedRole;
            }
            return prevRole;
          });

          return newRolesList;
        });

        setSelectedRole((prevSelectedRole) => {
          if (!prevSelectedRole) {
            return prevSelectedRole;
          }
          const roleMetadata = {
            ...prevSelectedRole.metadata,
            ...updateRoleMetadataResponse,
          };
          return {
            metadata: roleMetadata,
            isNewRole: prevSelectedRole.isNewRole,
          };
        });
      } catch {
        showToast(
          translateWithNamespace(TranslationNamespace.Organization, 'Error.SavingRoleSettings'),
          true,
        );
      } finally {
        setIsRoleSaving(false);
      }
    },
    [organization, showToast, translateWithNamespace, updateRoleMetadataAsync],
  );

  const handleDeleteRole = useCallback(
    (role: GroupRoleMetadata) => {
      if (!organization?.id || role.id === undefined) {
        return;
      }

      setIsRoleSaving(true);

      deleteRole(
        {
          groupId: Number.parseInt(organization.groupId, 10),
          rolesetId: role.id,
        },
        {
          onError: () => {
            showToast(
              translateWithNamespace(TranslationNamespace.Organization, 'Error.DeletingRole'),
              true,
            );
          },
          onSuccess: () => {
            if (isMobile) {
              setSelectedTab(undefined);
              setSelectedRole(undefined);
            }

            logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsDeleteRole, {
              group_id: organization.groupId ?? '',
              role_id: role.id?.toString() ?? '',
            });
            setLocalRoles((prev) => prev?.filter((r) => r.metadata?.id !== role.id));
            setSelectedRole(undefined);
          },
          onSettled: () => {
            setIsRoleSaving(false);
          },
        },
      );
    },
    [organization, unifiedLogger, isMobile, showToast, translateWithNamespace, deleteRole],
  );

  const handleSelectRole = useCallback(
    (role: GroupRoleMetadata | null, autoSelectTab = true) => {
      if (role && role.id) {
        navigation?.navigateToRole?.(role.id.toString());
        setSelectedRole({ metadata: role });
        if (autoSelectTab) {
          setSelectedTab(
            role.id === undefined ? ConfigureRoleTab.Settings : ConfigureRoleTab.Permissions,
          );
        }
      } else {
        setIsCreateModalOpen(true);
      }
    },
    [setIsCreateModalOpen, navigation],
  );

  const handleCreateRoleSubmit = useCallback(
    async (name: string) => {
      const roleMetadata: RoleMetadataForNewRole = {
        name,
        rank: DefaultNewRoleRank,
        description: '',
        color: getRandomRoleColorType(),
      };
      await handleCreateRole(roleMetadata);
    },
    [handleCreateRole],
  );

  const newRolePermissionsTabContent = useMemo(() => {
    const isDefaultMemberRole = selectedRole?.metadata?.id === DefaultMemberRoleIdNumber;
    const isGuestRole = selectedRole?.metadata?.rank === GuestRoleRank;
    const creatorType = isDefaultMemberRole
      ? CreatorTypes.MEMBER_ROLE
      : isGuestRole
        ? CreatorTypes.GUEST_ROLE
        : CreatorTypes.ROLE;
    const creatorFilter = [
      {
        type: creatorType,
        id: selectedRole?.metadata?.id?.toString() ?? '',
        name: selectedRole?.metadata?.name ?? '',
      },
    ] satisfies CreatorDetails[];
    const entity = {
      type: EntityTypes.GROUP,
      id: organization?.groupId ?? '',
    } satisfies EntityDetails;
    return (
      <Grid container>
        <PermissionsContainer
          creatorFilter={creatorFilter}
          entity={entity}
          uiConfig={{
            singleCreatorExperience: true,
            showConfirmationOnSave: isDefaultMemberRole,
            showRevokeAllButton: false,
          }}
          key={selectedRole?.metadata?.id}
        />
      </Grid>
    );
  }, [
    organization?.groupId,
    selectedRole?.metadata?.id,
    selectedRole?.metadata?.name,
    selectedRole?.metadata?.rank,
  ]);

  const roleMembersTabContent = useMemo(() => {
    if (!selectedRole?.metadata) {
      return null;
    }

    const { isNewRole } = selectedRole;
    const canCreateRoles = isNewRole === true && permissions?.canCreateRoles === true;

    const canAssignRole =
      !!selectedRole.metadata.id &&
      permissions?.assignableRoleIds?.includes(selectedRole.metadata.id.toString()) === true;
    const roleMembersEnabled = canAssignRole || isUnrestricted;

    const canViewRoleMembers = roleMembersEnabled || canCreateRoles;

    return (
      <>
        {permissions === undefined ? (
          <Grid container justifyContent='center'>
            <CircularProgress />
          </Grid>
        ) : (
          <>{canViewRoleMembers && <RoleMembers role={selectedRole.metadata} />}</>
        )}
      </>
    );
  }, [isUnrestricted, permissions, selectedRole]);

  const roleSettingsTabContent = useMemo(() => {
    if (!selectedRole?.metadata) {
      return null;
    }

    const { isNewRole } = selectedRole;
    const canCreateRoles = isNewRole === true && permissions?.canCreateRoles === true;

    const canEditRoleMetadata =
      !!selectedRole.metadata.id &&
      permissions?.metadataEditableRoleIds?.includes(selectedRole.metadata.id.toString()) === true;
    const roleSettingsEnabled = isUnrestricted || canEditRoleMetadata || canCreateRoles;

    const canAssignRole =
      !!selectedRole.metadata.id &&
      permissions?.assignableRoleIds?.includes(selectedRole.metadata.id.toString()) === true;

    const canViewRoleSettings = roleSettingsEnabled || canAssignRole || canCreateRoles;

    return (
      <>
        {permissions === undefined ? (
          <Grid container justifyContent='center'>
            <CircularProgress />
          </Grid>
        ) : (
          <>
            {canViewRoleSettings && (
              <RoleSettings
                key={selectedRole.metadata?.id}
                role={selectedRole.metadata}
                disabled={!roleSettingsEnabled}
                onSave={handleUpdateRoleSettings}
                onDelete={handleDeleteRole}
                saving={isRoleSaving}
              />
            )}
          </>
        )}
      </>
    );
  }, [
    handleDeleteRole,
    handleUpdateRoleSettings,
    isRoleSaving,
    isUnrestricted,
    permissions,
    selectedRole,
  ]);

  if (isMobile) {
    if (selectedRole === undefined) {
      return (
        <>
          <Grid container className={container} wrap='wrap'>
            <Grid item XSmall>
              <RolesSidebar
                roles={localRoles}
                setRoles={setLocalRoles}
                selectedRole={selectedRole}
                onSelectedRole={handleSelectRole}
                loading={isLoading}
                disabled={disabled}
                isMobile={isMobile}
              />
            </Grid>
          </Grid>
          <CreateRoleModal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreateRoleSubmit}
            saving={isRoleSaving}
          />
        </>
      );
    }
    if (selectedRole.metadata !== undefined && selectedTab === undefined) {
      return (
        <Grid container>
          <Grid item XSmall={12} style={{ marginBottom: 12 }}>
            <Button
              startIcon={<NavigateBeforeIcon />}
              onClick={() => setSelectedRole(undefined)}
              color='primary'
              className={beforeButton}>
              {translate('Heading.Roles')}
            </Button>
          </Grid>
          <Grid item XSmall={12} style={{ margin: '12px 12px 32px' }}>
            <Grid container>
              {selectedRole.metadata.id === DefaultMemberRoleIdNumber ? (
                <Icon
                  name='icon-filled-square-person'
                  size='Medium'
                  style={getRoleStyle(selectedRole.metadata.color, palette.mode, 'color')}
                />
              ) : (
                <Icon
                  name='icon-filled-person-rectangle-horizontal-line'
                  size='Medium'
                  style={getRoleStyle(selectedRole.metadata.color, palette.mode, 'color')}
                />
              )}
              <Typography variant='body1' style={{ marginLeft: 8 }}>
                {selectedRole.metadata.name}
              </Typography>
            </Grid>
          </Grid>
          <Grid item XSmall={12} style={{ padding: '0px 12px 32px' }}>
            <Divider className={horizontalDivider} />
          </Grid>
          {CONFIGURE_ROLE_TABS.map((tab) => (
            <Grid item XSmall={12} key={tab}>
              <Button
                disabled={
                  tab === ConfigureRoleTab.Members &&
                  (selectedRole?.metadata?.id === DefaultMemberRoleIdNumber ||
                    selectedRole?.metadata?.rank === 0)
                }
                onClick={() => setSelectedTab(tab)}
                fullWidth
                color='primary'
                className={roleButton}>
                {translate(`Label.${tab}`)}
                <ChevronRightIcon />
              </Button>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (selectedRole.metadata !== undefined && selectedTab === ConfigureRoleTab.Permissions) {
      return (
        <Grid
          container
          style={{
            display: selectedTab !== ConfigureRoleTab.Permissions ? 'none' : 'block',
          }}>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => setSelectedTab(undefined)}
            color='primary'
            className={beforeButton}>
            {selectedRole.metadata.name}
          </Button>
          <Grid container className={container}>
            {newRolePermissionsTabContent}
          </Grid>
        </Grid>
      );
    }
    if (selectedRole.metadata !== undefined && selectedTab === ConfigureRoleTab.Members) {
      return (
        <Grid container>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => setSelectedTab(undefined)}
            color='primary'
            className={beforeButton}>
            {selectedRole.metadata.name}
          </Button>
          <Grid container className={container}>
            {roleMembersTabContent}
          </Grid>
        </Grid>
      );
    }
    if (selectedRole.metadata !== undefined && selectedTab === ConfigureRoleTab.Settings) {
      return (
        <Grid container>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => setSelectedTab(undefined)}
            color='primary'
            className={beforeButton}>
            {selectedRole.metadata.name}
          </Button>
          <Grid container className={container}>
            {roleSettingsTabContent}
          </Grid>
        </Grid>
      );
    }
  }

  return (
    <Grid container className={container} wrap='wrap'>
      <Grid container className={innerContainer}>
        <Grid item className={column}>
          <RolesSidebar
            roles={localRoles}
            setRoles={setLocalRoles}
            selectedRole={selectedRole}
            onSelectedRole={handleSelectRole}
            loading={isLoading}
            disabled={disabled}
            isMobile={isMobile}
          />
        </Grid>

        <Grid container item justifyContent='center' className={tabContent}>
          {selectedRole && (
            <Grid container direction='column' alignContent='flex-start' wrap='wrap'>
              <Grid container direction='column' alignContent='flex-start' wrap='wrap'>
                <Tabs
                  orientation='horizontal'
                  value={selectedTab}
                  variant='fullWidth'
                  className='width-full'
                  style={{ borderBottom: '1px solid var(--color-stroke-default)' }}>
                  {CONFIGURE_ROLE_TABS.map((tab) => (
                    <Tab
                      key={tab}
                      label={translateWithNamespace(
                        TranslationNamespace.GroupManagement,
                        `Label.${tab}`,
                      )}
                      value={tab}
                      disabled={
                        tab === ConfigureRoleTab.Members &&
                        (selectedRole?.metadata?.id === DefaultMemberRoleIdNumber ||
                          selectedRole?.metadata?.rank === 0)
                      }
                      onClick={() => setSelectedTab(tab)}
                    />
                  ))}
                </Tabs>
              </Grid>

              {!selectedRole && (
                <Grid container justifyContent='center'>
                  <CircularProgress />
                </Grid>
              )}
              {selectedRole && (
                <Grid
                  container
                  style={{
                    display: selectedTab !== ConfigureRoleTab.Permissions ? 'none' : 'block',
                  }}>
                  {newRolePermissionsTabContent}
                </Grid>
              )}

              {selectedRole && selectedTab === ConfigureRoleTab.Members && (
                <>{roleMembersTabContent}</>
              )}

              {selectedRole && selectedTab === ConfigureRoleTab.Settings && (
                <>{roleSettingsTabContent}</>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
      <CreateRoleModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateRoleSubmit}
        saving={isRoleSaving}
      />
    </Grid>
  );
};

export default withTranslation(GroupRoles, [
  TranslationNamespace.Groups,
  TranslationNamespace.Organization,
  TranslationNamespace.Permissions,
  TranslationNamespace.GroupManagement,
]);

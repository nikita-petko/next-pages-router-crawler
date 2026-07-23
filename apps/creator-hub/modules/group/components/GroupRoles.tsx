import React, {
  FunctionComponent,
  Fragment,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  useSnackbar,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  useMediaQuery,
  Button,
  NavigateBeforeIcon,
  SupervisedUserCircleOutlinedIcon,
  ChevronRightIcon,
  PortraitOutlinedIcon as PortraitOutlined,
} from '@rbx/ui';
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { groupsClient, organizationApiClient } from '@modules/clients';
import { RobloxGroupsApiGroupRoleResponse } from '@rbx/clients/groups';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { getResponseFromError } from '@modules/clients/utils';
import { PermissionsContainer } from '@modules/permissions/containers/PermissionsContainer';
import { CreatorTypes, EntityTypes } from '@modules/permissions/utils/enums';
import { CreatorDetails, EntityDetails } from '@modules/permissions/utils/types';
import {
  useGetRolesByOrganizationId,
  useUpdateRolePosition,
} from '@modules/react-query/organizations';
import { useParams } from 'next/navigation';
import Router from 'next/router';
import { useSettings } from '@modules/settings';
import { useThemeMode } from '@rbx/settings';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import { getRandomRoleColorType, getRoleStyle } from '../utils/groupUtils';
import ConfigureRoleTab from '../interface/ConfigureRoleTab';
import RoleSettings from './RoleSettings';
import RolesSidebar from './RolesSidebar';
import { DefaultMemberRoleId } from '../constants/groupConstants';
import MaintenanceBanner from './MaintenanceBanner';
import { OrganizationsEventName, logOrganizationsEvent } from '../utils/eventUtils';
import useCanAssignRoles from '../hooks/useCanAssignRoles';
import { RoleCreationMetadata, RoleMetadataForNewRole } from '../interface/RoleCreationMetadata';
import RoleMembersV2 from './roleMembersV2/RoleMembersV2';
import PermissionDeniedPage from './PermissionDeniedPage';

const useGroupRolesStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },

  innerContainer: {
    height: '100%',
  },

  title: {
    flexBasis: '100%',
    padding: '4px 0px',
  },

  horizontalDivider: {
    marginTop: 4,
    color: theme.palette.components.divider,
    width: '100%',
  },

  verticalDivider: {
    flex: '0 0 auto',
    marginLeft: 4,
    color: theme.palette.components.divider,
    height: '100%',
    border: `1px solid ${theme.palette.components.divider}`,
  },

  tabContent: {
    flex: '1 1',
    maxWidth: '75%',
    overflow: 'hidden',
  },

  roleConfigurationContainer: {
    margin: '32px 48px',
  },

  roleTitle: {
    marginBottom: 16,
  },

  column: {
    flex: '0 0 25%',
    maxWidth: '25%',
    overflow: 'hidden',
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
  const { roleParams = [] } = useParams();
  const roleId = roleParams[0];
  const { translate } = useTranslation();
  const { themeMode } = useThemeMode();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { organization, permissions, refreshPermission } = useCurrentOrganization();
  const { isUnrestricted } = useCanAssignRoles();
  const { isFetched } = useSettings();

  const {
    classes: {
      container,
      innerContainer,
      title,
      horizontalDivider,
      verticalDivider,
      roleConfigurationContainer,
      roleTitle,
      column,
      roleButton,
      tabContent,
      beforeButton,
    },
  } = useGroupRolesStyles();

  const { enqueue, close } = useSnackbar();

  const [isRoleSaving, setIsRoleSaving] = useState<boolean>(false);

  const [localRoles, setLocalRoles] = useState<RoleCreationMetadata[]>();
  const [legacyRoles, setLegacyRoles] = useState<RobloxGroupsApiGroupRoleResponse[]>();
  const [selectedRole, setSelectedRole] = useState<RoleCreationMetadata>();

  const [selectedTab, setSelectedTab] = useState<ConfigureRoleTab>();

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const showBottomToast = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const {
    data: fetchedRoles,
    isLoading,
    isError: isErrorFetchingRoles,
  } = useGetRolesByOrganizationId(organization?.id);

  useEffect(() => {
    if (!fetchedRoles) return;
    const withMetadata = fetchedRoles.map((metadata) => ({ metadata, isNewRole: false }));
    setLocalRoles(withMetadata);
  }, [fetchedRoles]);

  if (isErrorFetchingRoles) {
    showBottomToast(translate('Error.GroupRoles'));
  }

  // Automatically select the first configurable role on desktop, if no roles are selected
  useEffect(() => {
    if (isMobile || selectedRole || localRoles === undefined) {
      return;
    }

    if (isUnrestricted) {
      // User can manage all roles
      const role = roleId && localRoles.find((r) => r.metadata?.id === roleId);
      if (role) {
        setSelectedRole(role);
      } else {
        Router.replace(`/dashboard/group/roles/${localRoles?.[0]?.metadata?.id ?? ''}`);
        setSelectedRole(localRoles[0]); // Select first role, which is the default member role
      }
    } else {
      // User can only assign specific roles, select the first assignable role
      const assignableRoles = localRoles.filter(
        (role) => role.metadata?.id && permissions?.assignableRoleIds.includes(role.metadata.id),
      );

      const role = roleId && assignableRoles.find((r) => r.metadata?.id === roleId);
      if (role) {
        setSelectedRole(role);
      } else {
        Router.replace(`/dashboard/group/roles/${assignableRoles?.[0]?.metadata?.id ?? ''}`);
        setSelectedRole(assignableRoles[0]);
      }
    }

    setSelectedTab(ConfigureRoleTab.Permissions);
  }, [roleId, isMobile, localRoles, isUnrestricted, selectedRole, permissions?.assignableRoleIds]);

  const fetchLegacyRoles = useCallback(async () => {
    if (!organization?.groupId) {
      return;
    }

    try {
      const legacyRolesResponse = await groupsClient.getGroupRolesSetsInfo(
        Number.parseInt(organization.groupId, 10),
      );

      setLegacyRoles(legacyRolesResponse.roles);
    } catch {
      showBottomToast(translate('Error.GroupRoles'));
    }
  }, [organization?.groupId, setLegacyRoles, showBottomToast, translate]);

  // On load
  useEffect(() => {
    fetchLegacyRoles();
  }, [fetchLegacyRoles]);

  const { mutate: updateRolePosition } = useUpdateRolePosition();

  const handleUpdateRoleSettings = useCallback(
    async (role: RoleMetadata | RoleMetadataForNewRole, autoSelectTab: boolean = true) => {
      if (!organization?.id || !role.name || !role.color) {
        return;
      }

      setIsRoleSaving(true);

      try {
        if ('id' in role && role.id) {
          // Role already exists
          const updateRoleResponse = await organizationApiClient.roleClient.updateRoleMetadata(
            organization.id,
            role.id,
            {
              name: role.name,
              color: role.color,
            },
          );

          // Update role metadata in list
          setLocalRoles((prevRoles) => {
            const newRolesList = prevRoles?.map((prevRole) => {
              if (prevRole?.metadata?.id === role.id) {
                return {
                  metadata: {
                    ...prevRole.metadata,
                    name: updateRoleResponse.name,
                    color: updateRoleResponse.color,
                  },
                  isNewRole: prevRole.isNewRole,
                };
              }
              return prevRole;
            });

            return newRolesList;
          });

          // Role metadata is updated, update the role in the list
          setSelectedRole((prevSelectedRole) => {
            const roleMetadata = {
              ...prevSelectedRole?.metadata,
              name: updateRoleResponse.name,
              color: updateRoleResponse.color,
              id: updateRoleResponse.id,
              organizationId: updateRoleResponse.organizationId,
            };
            return {
              metadata: roleMetadata,
              isNewRole: prevSelectedRole?.isNewRole,
            };
          });
        } else {
          // Creating new role
          const createRoleResponse = await organizationApiClient.roleClient.createRole(
            organization.id,
            {
              name: role.name,
              color: role.color,
            },
          );

          const roleCreationMetadata = { metadata: createRoleResponse, isNewRole: true };

          updateRolePosition({
            organizationId: organization.id,
            roleId: roleCreationMetadata.metadata.id!,
            previousRoleId: localRoles?.at(-1)?.metadata?.id,
          });

          setLocalRoles((prevRoles) => prevRoles?.concat([roleCreationMetadata]));
          setSelectedRole(roleCreationMetadata);
          if (autoSelectTab) {
            setSelectedTab(ConfigureRoleTab.Settings);
          }
          refreshPermission();
        }
      } catch (e) {
        try {
          const response = getResponseFromError(e);

          if (!response?.json) {
            return;
          }

          const { message } = await response.json();

          if (message.match(/Role name is reserved/)) {
            // Specific error message for reserved role name.
            showBottomToast(translate('Error.ReservedRoleName'));
          } else {
            showBottomToast(translate('Error.SavingRoleSettings'));
          }
        } catch {
          showBottomToast(translate('Error.SavingRoleSettings'));
        }
      } finally {
        setIsRoleSaving(false);
      }
    },
    [
      organization?.id,
      updateRolePosition,
      localRoles,
      refreshPermission,
      showBottomToast,
      translate,
    ],
  );

  const handleDeleteRole = useCallback(
    async (role: RoleMetadata) => {
      if (!organization?.id || !role.id) {
        return;
      }

      setIsRoleSaving(true);

      try {
        // Deleting role
        await organizationApiClient.roleClient.deleteRole(organization.id, role.id);

        setLocalRoles((prevRoles) => {
          /* Remove role from list */
          const newRoles = prevRoles
            ?.filter((prevRole) => prevRole?.metadata?.id !== role.id)
            .map((existingRole) => ({ ...existingRole, isNewRole: false }));

          setSelectedRole(undefined);

          return newRoles;
        });

        // On mobile, we don't automatically select any roles
        // therefore, we need to reset the "tab" and selected role
        if (isMobile) {
          setSelectedTab(undefined);
          setSelectedRole(undefined);
        }

        logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsDeleteRole, {
          group_id: organization.groupId ?? '',
          role_id: role.id.toString(),
        });
      } catch {
        showBottomToast(translate('Error.DeletingRole'));
      } finally {
        setIsRoleSaving(false);
      }
    },
    [organization?.id, organization?.groupId, unifiedLogger, isMobile, showBottomToast, translate],
  );

  const handleSelectRole = useCallback(
    (role: RoleMetadata | null, autoSelectTab: boolean = true) => {
      // If role exists, just select it
      if (role && role.id) {
        Router.replace(`/dashboard/group/roles/${role.id}`);
        setSelectedRole({ metadata: role });
        if (autoSelectTab) {
          setSelectedTab(
            role.id === undefined ? ConfigureRoleTab.Settings : ConfigureRoleTab.Permissions,
          );
        }
      } else {
        // Otherwise, create the role first then select it
        const roleCreationMetadata = {
          ...role,
          name: `${translate('Label.NewRole')} ${Math.floor(Math.random() * 10000)}`,
          color: getRandomRoleColorType(),
        };

        try {
          handleUpdateRoleSettings(
            {
              ...roleCreationMetadata,
              name: `${translate('Label.NewRole')} ${Math.floor(Math.random() * 10000)}`,
            },
            autoSelectTab,
          );
        } catch {
          // Try a second time if name collides (1% chance)
          handleUpdateRoleSettings(
            {
              ...roleCreationMetadata,
              name: `${translate('Label.NewRole')} ${Math.floor(Math.random() * 10000)}`,
            },
            autoSelectTab,
          );
        }
      }
    },
    [translate, handleUpdateRoleSettings],
  );
  const newRolePermissionsTabContent = useMemo(() => {
    const isDefaultMemberRole = selectedRole?.metadata?.id === DefaultMemberRoleId;
    const creatorFilter = [
      {
        type: isDefaultMemberRole ? CreatorTypes.MEMBER_ROLE : CreatorTypes.ROLE,
        id: selectedRole?.metadata?.id,
        name: selectedRole?.metadata?.name,
      } as CreatorDetails,
    ];
    const entity = { type: EntityTypes.ORGANIZATION, id: organization?.id } as EntityDetails;
    return (
      <Grid container marginLeft={-3} marginRight={-3} width='auto'>
        <PermissionsContainer
          creatorFilter={creatorFilter}
          entity={entity}
          uiConfig={{
            singleCreatorExperience: true,
            showConfirmationOnSave: isDefaultMemberRole,
            showRevokeAllButton: true,
          }}
          key={selectedRole?.metadata?.id}
        />
      </Grid>
    );
  }, [organization?.id, selectedRole?.metadata?.id, selectedRole?.metadata?.name]);

  const roleMembersTabContent = useMemo(() => {
    if (!selectedRole?.metadata) {
      return undefined;
    }

    const { isNewRole } = selectedRole;
    const canCreateRoles = isNewRole && permissions?.canCreateRoles;

    const canAssignRole =
      selectedRole.metadata.id && permissions?.assignableRoleIds.includes(selectedRole.metadata.id);
    const roleMembersEnabled = canAssignRole || isUnrestricted;

    const canViewRoleMembers = roleMembersEnabled || canCreateRoles;

    return (
      <Fragment>
        {permissions === undefined || !isFetched ? (
          <Grid container justifyContent='center'>
            <CircularProgress />
          </Grid>
        ) : (
          <Fragment>
            {canViewRoleMembers ? (
              // If user can READ or WRITE permissions, then show RoleMembers, but disable if only READ
              <RoleMembersV2 role={selectedRole.metadata} />
            ) : (
              // Otherwise, show not enough permissions
              <PermissionDeniedPage />
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }, [isFetched, isUnrestricted, permissions, selectedRole]);

  const roleSettingsTabContent = useMemo(() => {
    if (!selectedRole?.metadata) {
      return undefined;
    }

    // For Metadata, if a user can create roles this will be enabled, not just viewable (unlike permissions and settings where the role must be saved first)
    const { isNewRole } = selectedRole;

    const canCreateRoles = isNewRole && permissions?.canCreateRoles;

    // Role settings are enabled if 1) user is unrestricted or 2) user can edit role metadata 3) new role that can be created
    const canEditRoleMetadata =
      selectedRole.metadata.id &&
      permissions?.metadataEditableRoleIds?.includes(selectedRole.metadata.id);
    const roleSettingsEnabled = isUnrestricted || canEditRoleMetadata || canCreateRoles;

    const canAssignRole =
      selectedRole.metadata.id && permissions?.assignableRoleIds.includes(selectedRole.metadata.id);

    // User can view role settings if 1) user can assign role or 2) determined to be enabled above 3) new role tht can be created
    const canViewRoleSettings = roleSettingsEnabled || canAssignRole || canCreateRoles;

    return (
      <Fragment>
        {permissions === undefined ? (
          <Grid container justifyContent='center'>
            <CircularProgress />
          </Grid>
        ) : (
          <Fragment>
            {canViewRoleSettings ? (
              // If user can READ or WRITE settings, then show RoleSettings, but disable if only READ
              <RoleSettings
                role={selectedRole.metadata}
                disabled={!roleSettingsEnabled}
                onSave={handleUpdateRoleSettings}
                onDelete={handleDeleteRole}
                saving={isRoleSaving}
                isMobile={isMobile}
              />
            ) : (
              // Otherwise, show not enough permissions
              <PermissionDeniedPage />
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }, [
    handleDeleteRole,
    handleUpdateRoleSettings,
    isMobile,
    isRoleSaving,
    isUnrestricted,
    permissions,
    selectedRole,
  ]);

  // Mobile section
  if (isMobile) {
    if (selectedRole === undefined) {
      return (
        <Grid container className={container} wrap='wrap'>
          <HubMeta
            title={buildTitle(translate('Heading.Roles'))}
            breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
          />
          <MaintenanceBanner />
          <Grid className={title} item XSmall={12}>
            <Grid container>
              <Typography variant='body1'>{translate('Description.Roles')}</Typography>
            </Grid>
          </Grid>
          <Divider className={horizontalDivider} style={{ padding: 0, marginTop: 0 }} />
          <Grid item XSmall>
            <RolesSidebar
              roles={localRoles}
              setRoles={(newRoles) => setLocalRoles(newRoles)}
              legacyRoles={legacyRoles}
              selectedRole={selectedRole}
              onSelectedRole={handleSelectRole}
              loading={isLoading}
              disabled={disabled}
              isMobile={isMobile}
            />
          </Grid>
        </Grid>
      );
    }
    if (selectedRole.metadata !== undefined && selectedTab === undefined) {
      return (
        <Grid container>
          <HubMeta
            title={buildTitle(translate('Heading.Roles'))}
            breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
          />
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
              {selectedRole.metadata.id === DefaultMemberRoleId ? (
                <PortraitOutlined style={getRoleStyle(selectedRole.metadata.color, themeMode)} />
              ) : (
                <SupervisedUserCircleOutlinedIcon
                  style={getRoleStyle(selectedRole.metadata.color, themeMode)}
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
          {Object.keys(ConfigureRoleTab).map((tab) => (
            <Grid item XSmall={12} key={tab}>
              <Button
                disabled={
                  tab !== ConfigureRoleTab.Permissions &&
                  selectedRole?.metadata?.id === DefaultMemberRoleId
                }
                onClick={() =>
                  setSelectedTab(ConfigureRoleTab[tab as keyof typeof ConfigureRoleTab])
                }
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

    // new permissions UI is always rendered to persist permissions on tab change
    if (selectedRole.metadata !== undefined && selectedTab === ConfigureRoleTab.Permissions) {
      return (
        <Grid
          container
          style={{
            display: selectedTab !== ConfigureRoleTab.Permissions ? 'none' : 'block',
          }}>
          <HubMeta
            title={buildTitle(translate('Heading.Roles'))}
            breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
          />
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
          <HubMeta
            title={buildTitle(translate('Heading.Roles'))}
            breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
          />
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
          <HubMeta
            title={buildTitle(translate('Heading.Roles'))}
            breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
          />
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

  // End mobile section

  return (
    <Grid container className={container} wrap='wrap'>
      <HubMeta
        title={buildTitle(translate('Heading.Roles'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Roles'))}
      />
      <MaintenanceBanner />
      <Grid className={title} item XSmall={12}>
        <Grid container>
          <Typography variant='body1'>{translate('Description.Roles')}</Typography>
        </Grid>
      </Grid>
      <Divider className={horizontalDivider} />
      <Grid container className={innerContainer}>
        <Grid item className={column}>
          <RolesSidebar
            roles={localRoles}
            setRoles={(newRoles) => setLocalRoles(newRoles)}
            legacyRoles={legacyRoles}
            selectedRole={selectedRole}
            onSelectedRole={handleSelectRole}
            loading={isLoading}
            disabled={disabled}
            isMobile={isMobile}
          />
        </Grid>

        <Divider orientation='vertical' className={verticalDivider} />

        <Grid container item justifyContent='center' className={tabContent}>
          {selectedRole && (
            <Grid
              container
              direction='column'
              alignContent='flex-start'
              wrap='wrap'
              className={roleConfigurationContainer}>
              <Grid container direction='column' alignContent='flex-start' wrap='wrap'>
                <Typography variant='h3' className={roleTitle}>
                  {translate('Label.ConfigureRole', {
                    roleName: selectedRole?.metadata?.name ?? translate('Label.NewRole'),
                  })}
                </Typography>

                <Tabs
                  orientation='horizontal'
                  scrollButtons='auto'
                  value={selectedTab}
                  variant='standard'>
                  {Object.keys(ConfigureRoleTab).map((tab) => (
                    <Tab
                      key={tab}
                      label={translate(`Label.${tab}`)}
                      value={tab}
                      disabled={
                        tab !== ConfigureRoleTab.Permissions &&
                        selectedRole?.metadata?.id === DefaultMemberRoleId
                      }
                      onClick={() =>
                        setSelectedTab(ConfigureRoleTab[tab as keyof typeof ConfigureRoleTab])
                      }
                    />
                  ))}
                </Tabs>
              </Grid>

              {!selectedRole && (
                <Grid container justifyContent='center'>
                  <CircularProgress />
                </Grid>
              )}
              {/* new permissions UI is always rendered to persist permissions on tab change */}
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
                <Fragment>{roleMembersTabContent}</Fragment>
              )}

              {selectedRole && selectedTab === ConfigureRoleTab.Settings && (
                <Fragment>{roleSettingsTabContent}</Fragment>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default GroupRoles;

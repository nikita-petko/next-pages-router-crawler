import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Organization, OrganizationPermissions } from '../clients/organizationApi';
import organizationApiClient from '../clients/organizationApi';
import type {
  GroupManagementSurface,
  GroupData,
  AuthenticatedUser,
  GroupManagementNavigation,
  GroupManagementStudio,
  GroupManagementErrorComponents,
  GroupManagementLogger,
} from '../utils/types';
import GroupManagementContext from './GroupManagementContext';

type GroupManagementProviderProps = PropsWithChildren<{
  group: GroupData;
  user: AuthenticatedUser;
  surface: GroupManagementSurface;
  navigation: GroupManagementNavigation;
  showToast: (message: string, isError?: boolean) => void;
  studio?: GroupManagementStudio;
  errorComponents?: GroupManagementErrorComponents;
  unifiedLogger?: GroupManagementLogger;
}>;

const GroupManagementProvider: FunctionComponent<GroupManagementProviderProps> = ({
  group,
  user,
  surface,
  navigation,
  showToast,
  studio,
  errorComponents,
  unifiedLogger,
  children,
}) => {
  const [organization, setOrganization] = useState<Organization | undefined | null>();
  const [permissions, setPermissions] = useState<OrganizationPermissions | undefined | null>();
  const [isOrganizationRefreshRequired, setIsOrganizationRefreshRequired] =
    useState<boolean>(false);
  const [isOrganizationLoading, setIsOrganizationLoading] = useState<boolean>(false);

  const groupId = group.id;
  const userId = user.id;

  const getPermissions = useCallback(
    async (organizationId: string) => {
      if (userId === undefined || userId === null) {
        setPermissions(null);
        return;
      }

      try {
        const permissionsResponse = await organizationApiClient.userClient.getUserPermissions(
          organizationId,
          userId.toString(),
        );

        setPermissions(permissionsResponse);
      } catch {
        setPermissions(null);
      }
    },
    [userId],
  );

  const getOrganization = useCallback(async () => {
    setIsOrganizationLoading(true);

    try {
      if (!groupId) {
        setOrganization(null);
        return;
      }

      const organizationResponse = await organizationApiClient.organizationClient.getOrganization(
        groupId.toString(),
      );

      setOrganization(organizationResponse);
      await getPermissions(organizationResponse.id);

      setIsOrganizationRefreshRequired(false);
    } catch {
      setOrganization(null);
      setPermissions(null);
    } finally {
      setIsOrganizationLoading(false);
    }
  }, [groupId, getPermissions]);

  const refreshOrganization = useCallback(() => {
    setIsOrganizationRefreshRequired(true);
    void getOrganization();
  }, [getOrganization]);

  const refreshPermission = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    await getPermissions(organization.id);
  }, [getPermissions, organization]);

  const value = useMemo(
    () => ({
      group,
      user,
      surface,
      navigation,
      showToast,
      studio,
      errorComponents,
      unifiedLogger,
      organization,
      permissions,
      refreshOrganization,
      refreshPermission,
      isOrganizationRefreshRequired,
      isOrganizationLoading,
    }),
    [
      group,
      user,
      surface,
      navigation,
      showToast,
      studio,
      errorComponents,
      unifiedLogger,
      organization,
      permissions,
      refreshOrganization,
      refreshPermission,
      isOrganizationRefreshRequired,
      isOrganizationLoading,
    ],
  );

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- initial fetch sets the loading state before starting its asynchronous request
    void getOrganization();
  }, [getOrganization]);

  return (
    <GroupManagementContext.Provider value={value}>{children}</GroupManagementContext.Provider>
  );
};

export default GroupManagementProvider;

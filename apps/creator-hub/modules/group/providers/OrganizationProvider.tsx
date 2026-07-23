import React, {
  FunctionComponent,
  useEffect,
  useState,
  useCallback,
  Fragment,
  useMemo,
} from 'react';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useAuthentication } from '@modules/authentication/providers';
import {
  OrganizationPermissions,
  Organization,
  Invitation,
  InvitationStatusType,
} from '@modules/clients/organizationApi';
import { withTranslation } from '@rbx/intl';
import { organizationApiClient } from '@modules/clients';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
// eslint-disable-next-line no-restricted-imports -- used to get current group ID
import useAppBreadcrumbsData from '@modules/navigation/layout/hooks/useAppBreadcrumbsData';
import router from 'next/router';
import OrganizationContext from './OrganizationContext';
import AcceptInviteDialog from '../components/AcceptInviteDialog';
import InviteActionedDialog from '../components/InviteActionedDialog';
import { InviteQueryKey } from '../constants/groupConstants';

const OrganizationProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const { currentItemGroupId } = useAppBreadcrumbsData();

  const [organization, setOrganization] = useState<Organization | undefined | null>();
  const [permissions, setPermissions] = useState<OrganizationPermissions | undefined | null>();
  const [invitation, setInvitation] = useState<Invitation | undefined | null>();
  const [isOrganizationRefreshRequired, setIsOrganizationRefreshRequired] =
    useState<boolean>(false);
  const [isOrganizationLoading, setIsOrganizationLoading] = useState<boolean>(false);
  const [invitationAccepted, setInvitationAccepted] = useState<boolean>();
  const [isActionDialogOpen, setIsActionDialogOpen] = useState<boolean>(false);

  const currentGroupId = useMemo(() => {
    return currentGroup?.id || currentItemGroupId;
  }, [currentGroup, currentItemGroupId]);

  const redirectToDashboard = useCallback(() => {
    router.push(`https://create.${process.env.robloxSiteDomain}/dashboard/creations`);
  }, []);

  const getInvitation = useCallback(
    async (organizationId: string) => {
      if (!user?.id) {
        setInvitation(null);
        return;
      }

      try {
        const invitationResponse =
          await organizationApiClient.userClient.getUserInvitationByOrganization(
            organizationId,
            user.id.toString(),
          );

        setInvitation(invitationResponse);
      } catch {
        setInvitation(null);
        redirectToDashboard();
      }
    },
    [user, redirectToDashboard],
  );

  const getPermissions = useCallback(
    async (organizationId: string) => {
      if (!user?.id) {
        setPermissions(null);
        return;
      }

      try {
        const permissionsResponse = await organizationApiClient.userClient.getUserPermissions(
          organizationId,
          user.id.toString(),
        );

        setPermissions(permissionsResponse);
      } catch {
        setPermissions(null);
      }
    },
    [user],
  );

  const getOrganization = useCallback(async () => {
    setIsOrganizationLoading(true);

    try {
      // Use query string for invites when users are not authorized as group yet
      const organizationIdString = router.query[`${InviteQueryKey}`] as string | undefined;

      if (!currentGroupId && typeof organizationIdString !== 'undefined') {
        // No group selected, but there is specified invitation in query
        await getInvitation(organizationIdString);
        return;
      }

      if (!currentGroupId) {
        setOrganization(null);
        return;
      }

      // User is authorized as group, no need to fetch invitation
      setInvitation(null);

      if (currentGroupId) {
        const organizationResponse = await organizationApiClient.organizationClient.getOrganization(
          currentGroupId.toString(),
        );

        // User authorized as group, set organization and fetch permissions
        setOrganization(organizationResponse);
        await getPermissions(organizationResponse.id);
      } else {
        setOrganization(undefined);
      }

      setIsOrganizationRefreshRequired(false);
    } catch {
      setOrganization(null);
      setPermissions(null);
      setInvitation(null);
    } finally {
      setIsOrganizationLoading(false);
    }
  }, [currentGroupId, getInvitation, getPermissions]);

  const refreshOrganization = useCallback(() => {
    setIsOrganizationRefreshRequired(true);
    getOrganization();
  }, [getOrganization]);

  const refreshPermission = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    await getPermissions(organization?.id);
  }, [getPermissions, organization?.id]);

  const memoizedValue = useMemo(() => {
    return {
      organization,
      permissions,
      refreshOrganization,
      refreshPermission,
      isOrganizationRefreshRequired,
      isOrganizationLoading,
    };
  }, [
    organization,
    permissions,
    refreshOrganization,
    refreshPermission,
    isOrganizationRefreshRequired,
    isOrganizationLoading,
  ]);

  useEffect(() => {
    getOrganization();
  }, [getOrganization]);

  return (
    <OrganizationContext.Provider value={memoizedValue}>
      <Fragment>
        {children}

        {invitation && (
          <Fragment>
            <AcceptInviteDialog
              open={
                invitation.invitationStatusType === InvitationStatusType.Open &&
                invitationAccepted === undefined
              }
              onClose={(accepted) => {
                if (accepted === true) {
                  // Dialog closed with accept action
                  setInvitationAccepted(true);
                  setIsActionDialogOpen(true);
                } else if (accepted === false) {
                  // Dialog closed with decline action
                  setInvitationAccepted(false);
                  setIsActionDialogOpen(true);
                } else {
                  redirectToDashboard();
                  setInvitation(null);
                }
              }}
              invitation={invitation}
            />
            <InviteActionedDialog
              open={isActionDialogOpen}
              onClose={() => {
                setIsActionDialogOpen(false);

                if (invitationAccepted === true) {
                  refreshOrganization();
                }

                redirectToDashboard();
              }}
              invitation={invitation}
              accepted={invitationAccepted === true}
            />
          </Fragment>
        )}
      </Fragment>
    </OrganizationContext.Provider>
  );
};

export default withTranslation(OrganizationProvider, [TranslationNamespace.Organization]);

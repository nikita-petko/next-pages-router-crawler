import type { FunctionComponent, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { UnificationOptInModal } from '@rbx/group-management';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography, Grid, useMediaQuery, useTheme } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import useActivityFeedStyles from '@modules/creations/activityFeed/components/ActivityFeed.styles';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import { useGetGroupProductFeatures } from '@modules/react-query/groups/groupQueries';
import GroupActivityHistory from '../components/GroupActivityHistory';
import PermissionDeniedPage from '../components/PermissionDeniedPage';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupActivityHistoryContainer: FunctionComponent<PropsWithChildren> = () => {
  const {
    classes: { section },
  } = useActivityFeedStyles();

  const { translate } = useTranslation();
  const { organization, permissions, refreshPermission } = useCurrentOrganization();
  const { user } = useAuthentication();
  const groupId = organization?.groupId ? Number(organization.groupId) : undefined;
  const { data: productFeatures, isLoading: isProductFeaturesLoading } =
    useGetGroupProductFeatures(groupId);

  const isUnifiedUIEnabled = productFeatures?.isUnifiedUIEnabled === true;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('Small'));

  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    void refreshPermission().finally(() => {
      setInitialized(true);
    });
  }, [refreshPermission]);

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Label.ActivityHistory'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Label.ActivityHistory'))}
      />
      {!organization || !initialized || isProductFeaturesLoading ? (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      ) : (
        <>
          {groupId && user?.id && isUnifiedUIEnabled && permissions?.isOwner && (
            <UnificationOptInModal
              groupId={groupId}
              userId={user.id}
              getCreatorHubRoleUrl={creatorHub.getGroupRoleUrl}
              getLegacyRolesUrl={www.getConfigureGroupRolesUrl}
            />
          )}
          {!permissions?.isOwner && !permissions?.canViewAuditLogs ? (
            <PermissionDeniedPage />
          ) : (
            <section className={section}>
              <Grid container>
                {typeof organization === 'undefined' ||
                organization === null ||
                typeof organization.id === 'undefined' ? (
                  <EmptyGrid>
                    {organization === null ? (
                      <Typography color='secondary' align='center'>
                        {translate('Message.UnableToLoadOrganization')}
                      </Typography>
                    ) : (
                      <CircularProgress />
                    )}
                  </EmptyGrid>
                ) : (
                  <GroupActivityHistory isSmallScreen={isSmallScreen} organization={organization} />
                )}
              </Grid>
            </section>
          )}
        </>
      )}
    </>
  );
};

export default withTranslation(GroupActivityHistoryContainer, [
  TranslationNamespace.Organization,
  TranslationNamespace.ActivityFeed,
  TranslationNamespace.Groups,
  TranslationNamespace.GroupManagement,
  TranslationNamespace.Permissions,
]);

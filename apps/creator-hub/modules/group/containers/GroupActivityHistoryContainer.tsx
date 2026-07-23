import type { FunctionComponent } from 'react';
import React, { Fragment, useEffect, useState } from 'react';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography, Grid, useMediaQuery, useTheme } from '@rbx/ui';
import useActivityFeedStyles from '@modules/creations/activityFeed/components/ActivityFeed.styles';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GroupActivityHistory from '../components/GroupActivityHistory';
import PermissionDeniedPage from '../components/PermissionDeniedPage';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupActivityHistoryContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { section },
  } = useActivityFeedStyles();

  const { translate } = useTranslation();
  const { organization, permissions, refreshPermission } = useCurrentOrganization();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('Small'));

  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      await refreshPermission();
      setInitialized(true);
    };

    fetchPermissions();
  }, [refreshPermission]);

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Label.ActivityHistory'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Label.ActivityHistory'))}
      />
      {!organization || !initialized ? (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      ) : (
        <Fragment>
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
        </Fragment>
      )}
    </>
  );
};

export default withTranslation(GroupActivityHistoryContainer, [
  TranslationNamespace.Organization,
  TranslationNamespace.ActivityFeed,
  TranslationNamespace.Groups,
]);

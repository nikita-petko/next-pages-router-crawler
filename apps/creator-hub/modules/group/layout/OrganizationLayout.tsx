import React, { FunctionComponent, Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Grid, CircularProgress } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { TSettings, useSettings } from '@modules/settings';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { urls } from '@modules/miscellaneous/common';

export interface OrganizationLayoutProps {
  rolloutSetting?: keyof TSettings;
}

const OrganizationLayout: FunctionComponent<React.PropsWithChildren<OrganizationLayoutProps>> = ({
  rolloutSetting,
  children,
}) => {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const [enabled, setEnabled] = useState<boolean>();
  const { currentGroup, isFetched: isGroupsFetched } = useGroups();
  const router = useRouter();

  useEffect(() => {
    if (rolloutSetting === undefined) {
      setEnabled(true); // No settings are specified, so always enabled
    } else if (!isSettingsFetched) {
      setEnabled(undefined); // Still fetching settings
    } else {
      // Either the rollout setting or the ixp setting must be enabled
      const enabledByClientSettings = settings[rolloutSetting as keyof typeof settings] === true;

      setEnabled(enabledByClientSettings);
    }
  }, [settings, isSettingsFetched, rolloutSetting]);

  // This handles the case where a user on a group page switches to their personal account
  // Only redirect if groups are fetched and no group is selected (not just loading)
  useEffect(() => {
    if (isGroupsFetched && currentGroup === null) {
      router.replace(urls.creatorHub.dashboard.getUrl());
    }
  }, [currentGroup, isGroupsFetched, router]);

  const isRedirecting = isGroupsFetched && currentGroup === null;
  const isLoading = !isSettingsFetched || !isGroupsFetched || isRedirecting;

  const isFeatureDisabled = enabled === false;
  const isContentReady = enabled === true && isGroupsFetched && currentGroup !== null;

  if (isLoading) {
    return (
      <Grid justifyContent='center' alignItems='center' height='100%' container>
        <CircularProgress />
      </Grid>
    );
  }
  return (
    <Fragment>
      {isFeatureDisabled && <PageNotFound />}
      {isContentReady && !isFeatureDisabled && children}
    </Fragment>
  );
};

export default withTranslation(OrganizationLayout, [TranslationNamespace.Organization]);

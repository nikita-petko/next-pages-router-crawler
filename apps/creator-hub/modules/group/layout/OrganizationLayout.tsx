import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { Fragment, useEffect, useState } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

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
      const enabledByClientSettings = settings[rolloutSetting] === true;

      setEnabled(enabledByClientSettings);
    }
  }, [settings, isSettingsFetched, rolloutSetting]);

  // This handles the case where a user on a group page switches to their personal account
  // Only redirect if groups are fetched and no group is selected (not just loading)
  useEffect(() => {
    if (isGroupsFetched && currentGroup === null) {
      router.replace(creatorHub.dashboard.getUrl());
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
    <>
      {isFeatureDisabled && <PageNotFound />}
      {isContentReady && !isFeatureDisabled && children}
    </>
  );
};

export default withTranslation(OrganizationLayout, [TranslationNamespace.Organization]);

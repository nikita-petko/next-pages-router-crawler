import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { InviteQueryKey } from '../constants/groupConstants';

export interface OrganizationLayoutProps {
  rolloutSetting?: keyof TSettings;
}

const OrganizationLayout: FunctionComponent<React.PropsWithChildren<OrganizationLayoutProps>> = ({
  rolloutSetting,
  children,
}) => {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { currentGroup, isFetched: isGroupsFetched } = useGroups();
  const router = useRouter();
  const isInviteLink = router.isReady && typeof router.query[InviteQueryKey] === 'string';
  const enabled =
    rolloutSetting === undefined
      ? true
      : isSettingsFetched
        ? settings[rolloutSetting] === true
        : undefined;

  // This handles the case where a user on a group page switches to their personal account
  // Only redirect if groups are fetched and no group is selected (not just loading)
  useEffect(() => {
    if (router.isReady && isGroupsFetched && currentGroup === null && !isInviteLink) {
      void router.replace(creatorHub.dashboard.getUrl());
    }
  }, [currentGroup, isGroupsFetched, isInviteLink, router]);

  const isRedirecting = router.isReady && isGroupsFetched && currentGroup === null && !isInviteLink;
  const isLoading = !router.isReady || !isSettingsFetched || !isGroupsFetched || isRedirecting;

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

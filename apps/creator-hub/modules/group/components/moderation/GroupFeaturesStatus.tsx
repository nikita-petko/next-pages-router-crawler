import React, { useMemo } from 'react';
import { SystemBanner } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetGroupFeaturesStatus } from '@modules/react-query/groupFeatures/groupFeaturesQueries';
import { useSettings } from '@modules/settings';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';

const GroupFeaturesStatus = () => {
  const { organization, permissions } = useCurrentOrganization();
  const { settings, isFetched } = useSettings();
  const { translate } = useTranslation();

  const {
    data: groupFeaturesStatus,
    isFetching: isFeaturesStatusFetching,
    isError: isFeaturesStatusError,
  } = useGetGroupFeaturesStatus(organization?.groupId);

  const isGroupBlocked = useMemo(() => {
    return groupFeaturesStatus?.hasFeaturesBlocked;
  }, [groupFeaturesStatus]);

  if (isFeaturesStatusFetching || isFeaturesStatusError || !isFetched || !isGroupBlocked) {
    return null;
  }

  return (
    <SystemBanner
      title={translate('Heading.GroupFeatureStatusWarning')}
      description={
        permissions?.canManageGroupFeatures && settings.enableGroupModerationPage
          ? translate('Description.GroupFeatureStatusWarningOwner')
          : translate('Description.GroupFeatureStatusWarning')
      }
      variant='Standard'
      severity='Warning'
      primaryActionLabel={
        permissions?.canManageGroupFeatures && settings.enableGroupModerationPage
          ? translate('Action.GoToModeration')
          : undefined
      }
      onPrimaryAction={() => window.open(`/dashboard/group/moderation`)}
    />
  );
};

export default withTranslation(GroupFeaturesStatus, [TranslationNamespace.Organization]);

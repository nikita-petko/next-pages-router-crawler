import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { StatusCodes } from '@rbx/core';
import { ProgressCircle } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import GroupModeration from '../components/moderation/GroupModeration';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupModerationContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { organization, permissions } = useCurrentOrganization();
  const { settings, isFetched } = useSettings();
  const router = useRouter();

  if (!organization || !isFetched) {
    return (
      <div className='flex justify-center'>
        <ProgressCircle ariaLabel='Progress' />
      </div>
    );
  }

  if (!settings.enableGroupModerationPage) {
    router.replace('/404');
    return null;
  }

  return (
    <>
      {!permissions?.canManageGroupFeatures ? (
        <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
      ) : (
        <GroupModeration />
      )}
    </>
  );
};

export default withTranslation(GroupModerationContainer, [TranslationNamespace.Organization]);

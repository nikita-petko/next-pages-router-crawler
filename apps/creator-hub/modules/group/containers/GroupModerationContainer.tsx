import React, { Fragment, FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { ProgressCircle } from '@rbx/foundation-ui';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { useSettings } from '@modules/settings';
import { useRouter } from 'next/router';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import GroupModeration from '../components/moderation/GroupModeration';

const GroupModerationContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
    <Fragment>
      {!permissions?.canManageGroupFeatures ? (
        <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
      ) : (
        <GroupModeration />
      )}
    </Fragment>
  );
};

export default withTranslation(GroupModerationContainer, [TranslationNamespace.Organization]);

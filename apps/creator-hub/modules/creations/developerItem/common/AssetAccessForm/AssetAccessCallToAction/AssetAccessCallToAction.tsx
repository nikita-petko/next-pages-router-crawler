import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Link } from '@rbx/ui';
import type { CreatorType } from '@modules/miscellaneous/common';
import useAssetPrivacyEnrollmentInformation from '../../../creatorStore/hooks/useAssetPrivacyEnrollmentInformation';
import useAssetAccessCallToActionStyles from './AssetAccessCallToAction.styles';

export type AssetAccessCallToActionProps = {
  creator: { id: number; type: CreatorType };
  severity?: 'success' | 'warning';
};

const AssetAccessCallToAction: FunctionComponent<
  React.PropsWithChildren<AssetAccessCallToActionProps>
> = ({ creator, severity = 'success' }) => {
  const {
    classes: { alert, enrollButton },
  } = useAssetAccessCallToActionStyles({ severity });
  const { translate } = useTranslation();

  const { enrollUrl, eligibleForEnrollLink } = useAssetPrivacyEnrollmentInformation({ creator });

  if (!eligibleForEnrollLink) {
    return null;
  }

  return (
    <Alert
      severity={severity}
      variant='standard'
      action={
        <Button
          color='inherit'
          size='small'
          target='_blank'
          component={Link}
          href={enrollUrl}
          classes={{ root: enrollButton }}>
          {translate('Action.Enroll')}
        </Button>
      }
      classes={{ root: alert }}>
      <AlertTitle color='inherit'>{translate('Label.AssetPrivacyBeta')}</AlertTitle>
    </Alert>
  );
};

export default AssetAccessCallToAction;

import { Alert, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { InterventionStatus } from '@rbx/clients/rightsV1';

interface ActionInvocation {
  Type: {
    ActionInvocation: {
      fields: {
        'Field.TimeoutDurationSeconds': number;
      };
    };
  };
}

// ClaimCreationRestrictionBanner is a banner to show the user that they cannot create a claim because they are restricted by a timeout
export const ClaimCreationRestrictionBanner = ({
  intervention,
}: {
  intervention: InterventionStatus;
}) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return undefined;
  }
  const interventionType = intervention?.type;
  let duration = 0;

  /*
   * We are validating the following object structure for interventionType:
   * {
   *   Type:{
   *     ActionInvocation: {
   *       fields: {
   *         'Field.TimeoutDurationSeconds': number;
   *       };
   *     };
   *   }
   * }
   */
  if (
    interventionType &&
    'Type' in interventionType &&
    typeof interventionType.Type === 'object' &&
    interventionType.Type !== null &&
    'ActionInvocation' in interventionType.Type &&
    typeof interventionType.Type.ActionInvocation === 'object' &&
    interventionType.Type.ActionInvocation !== null &&
    'fields' in interventionType.Type.ActionInvocation &&
    typeof interventionType.Type.ActionInvocation.fields === 'object' &&
    interventionType.Type.ActionInvocation.fields !== null &&
    'Field.TimeoutDurationSeconds' in interventionType.Type.ActionInvocation.fields &&
    typeof interventionType.Type.ActionInvocation.fields['Field.TimeoutDurationSeconds'] ===
      'number'
  ) {
    const typeData = interventionType as ActionInvocation;
    duration = typeData.Type.ActionInvocation.fields['Field.TimeoutDurationSeconds'];
  }
  if (!duration || !intervention.startTime || !intervention.startTime.seconds) {
    return undefined;
  }
  const expiresAt = new Date(intervention.startTime.seconds * 1000 + duration * 1000);
  return (
    <Alert severity='error' sx={{ width: '100%' }}>
      <Typography variant='body1'>
        {translate('Message.FeatureRestrictedUntil', { date: expiresAt.toLocaleString() })}
      </Typography>
    </Alert>
  );
};

export default withTranslation(ClaimCreationRestrictionBanner, [TranslationNamespace.RightsPortal]);

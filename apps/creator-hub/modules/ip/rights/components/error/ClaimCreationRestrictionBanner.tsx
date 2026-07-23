import type { InterventionStatus } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface ActionInvocation {
  Type: {
    ActionInvocation: {
      fields: {
        'Field.TimeoutDurationSeconds': number;
      };
    };
  };
}

function isActionInvocation(interventionType: unknown): interventionType is ActionInvocation {
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
  return (
    // Ensure object
    typeof interventionType === 'object' &&
    interventionType !== null &&
    // Ensure 'Type' property exists and is an object
    'Type' in interventionType &&
    typeof interventionType.Type === 'object' &&
    interventionType.Type !== null &&
    // Ensure 'ActionInvocation' property exists and is an object
    'ActionInvocation' in interventionType.Type &&
    typeof interventionType.Type.ActionInvocation === 'object' &&
    interventionType.Type.ActionInvocation !== null &&
    // Ensure 'fields' property exists and is an object
    'fields' in interventionType.Type.ActionInvocation &&
    typeof interventionType.Type.ActionInvocation.fields === 'object' &&
    interventionType.Type.ActionInvocation.fields !== null &&
    // Ensure 'Field.TimeoutDurationSeconds' property exists and is a number
    'Field.TimeoutDurationSeconds' in interventionType.Type.ActionInvocation.fields &&
    typeof interventionType.Type.ActionInvocation.fields['Field.TimeoutDurationSeconds'] ===
      'number'
  );
}

// ClaimCreationRestrictionBanner is a banner to show the user that they cannot create a claim because they are restricted by a timeout
const ClaimCreationRestrictionBanner = ({ intervention }: { intervention: InterventionStatus }) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return undefined;
  }
  const interventionType = intervention?.type;
  let duration = 0;

  if (isActionInvocation(interventionType)) {
    duration = interventionType.Type.ActionInvocation.fields['Field.TimeoutDurationSeconds'];
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

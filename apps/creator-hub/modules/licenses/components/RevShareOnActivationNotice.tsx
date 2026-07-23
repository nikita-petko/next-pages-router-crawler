import type { FunctionComponent } from 'react';
import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import type { LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { formatRoyaltyRate } from '../utils/format';
import { getRevShareOnActivationDescriptionKey } from '../utils/licenseApplicationRequirementsFieldsUtils';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';

interface RevShareOnActivationNoticeProps {
  revShareValue?: number;
  licenseDuration?: LicenseDurationResponse;
  licenseType?: LicenseType;
  enableCollaborationLicensing?: boolean;
}

/** Informational copy when rev-share timing is fixed at agreement activation (not user-selectable). */
const RevShareOnActivationNotice: FunctionComponent<RevShareOnActivationNoticeProps> = ({
  revShareValue,
  licenseDuration,
  licenseType,
  enableCollaborationLicensing = false,
}) => {
  const { translate } = useTranslation();
  const descriptionKey = getRevShareOnActivationDescriptionKey({
    revShareValue,
    licenseDuration,
    licenseType,
    enableCollaborationLicensing,
  });
  const isNonZeroRevShare = getIsNonZeroRevShareFromValue(revShareValue);

  return (
    <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
      <Grid item>
        <Typography variant='h6'>{translate('Label.RevShareTiming')}</Typography>
      </Grid>
      <Grid item>
        <Typography variant='body1'>
          {isNonZeroRevShare
            ? translate(descriptionKey, {
                value: formatRoyaltyRate(revShareValue),
              })
            : translate(descriptionKey)}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default RevShareOnActivationNotice;

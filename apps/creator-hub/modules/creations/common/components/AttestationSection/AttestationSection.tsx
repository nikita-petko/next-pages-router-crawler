import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Checkbox, FormControlLabel, Grid, Typography } from '@rbx/ui';
import { terms } from '@modules/miscellaneous/urls';
import OverviewInlineUrlTranslationLabel from '../OverviewInlineUrlTranslationLabel';

type AttestationSectionProps = {
  descriptionKey: string;
  /** When provided, renders the description via OverviewInlineUrlTranslationLabel.
   *  Requires descriptionKey to contain `linkStart`/`linkEnd` link tokens. */
  descriptionLinkUrl?: string;
  disabled?: boolean;
  hideHeading?: boolean;
  isEditMode?: boolean;
  tosKey: string;
  onAttestationChange: (isComplete: boolean) => void;
};

const AttestationSection: FunctionComponent<AttestationSectionProps> = ({
  descriptionKey,
  descriptionLinkUrl,
  disabled = false,
  hideHeading = false,
  isEditMode = false,
  tosKey,
  onAttestationChange,
}) => {
  const { translate } = useTranslation();
  const [tosAccepted, setTosAccepted] = useState(false);

  const handleTosChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTosAccepted(e.target.checked);
      onAttestationChange(e.target.checked);
    },
    [onAttestationChange],
  );

  return (
    <Grid container item direction='column' spacing={1}>
      {!hideHeading && (
        <Grid item XSmall={12}>
          <Typography
            component={isEditMode ? 'h4' : 'h3'}
            variant={isEditMode ? 'h5' : 'h3'}
            style={{ marginBottom: 0 }}>
            {translate('Heading.AttestToOwnership')}
          </Typography>
        </Grid>
      )}
      <Grid item XSmall={12}>
        {descriptionLinkUrl ? (
          <OverviewInlineUrlTranslationLabel
            anchorTargetUrl={descriptionLinkUrl}
            closing='linkEnd'
            linkVariantOverride='body1'
            opening='linkStart'
            translationKey={descriptionKey}
            typographyColorOverride='inherit'
            typographyVariantOverride='body1'
          />
        ) : (
          <Typography variant='body1'>{translate(descriptionKey)}</Typography>
        )}
      </Grid>
      <Grid container item direction='column' spacing={0}>
        <Grid item XSmall={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={tosAccepted}
                color='secondary'
                disabled={disabled}
                onChange={handleTosChange}
                size='medium'
              />
            }
            label={
              <OverviewInlineUrlTranslationLabel
                anchorTargetUrl={terms.getAudioDistributionOnboardingLegalAgreementUrl()}
                closing='tosLinkEnd'
                linkVariantOverride='body1'
                opening='tosLinkStart'
                translationKey={tosKey}
                typographyColorOverride='inherit'
                typographyVariantOverride='body1'
              />
            }
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AttestationSection;

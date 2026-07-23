import React from 'react';
import { FormControl, FormControlLabel, Grid, Link, Radio, RadioGroup, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Controller, useFormContext } from 'react-hook-form';
import { DisputeReasonEnum } from '@rbx/clients/rightsV1';
import { resolveUrl } from '@rbx/env-utils';
import useModalStyles from '../useModalStyles';

export interface ReasonFormProps {
  claimantName: string;
  isDevMarketplace: boolean;
}

// ReasonForm displays the 1st page of the dispute form that explains and requests the reason for the dispute
function ReasonForm({ claimantName, isDevMarketplace }: ReasonFormProps) {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { radioItem },
  } = useModalStyles();
  const { control } = useFormContext();
  const claimant = claimantName === '' ? translate('Label.Claimant') : `@${claimantName}`;
  return (
    <Grid container item XSmall>
      <Grid item XSmall={12}>
        <Typography>
          {translateHTML('Description.DisputeReasonSent', [
            {
              opening: 'boldStart',
              closing: 'boldEnd',
              content() {
                return <strong>{claimant}</strong>;
              },
            },
          ])}
        </Typography>
      </Grid>
      <Grid item container XSmall={12}>
        <Controller
          name='reason'
          control={control}
          render={({ field }) => (
            <FormControl {...field} required margin='normal'>
              <RadioGroup
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                }}>
                <FormControlLabel
                  value={DisputeReasonEnum.Original}
                  control={<Radio aria-label='original' />}
                  className={radioItem}
                  label={
                    <Grid item container XSmall={12}>
                      <Grid item XSmall={12}>
                        <Typography>{translate('Description.DisputeReasonOriginal')}</Typography>
                      </Grid>
                      <Grid item XSmall={12}>
                        <Typography variant='body2' color='secondary'>
                          {translate('Description.DisputeReasonOriginalSub')}
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                />
                <FormControlLabel
                  value={DisputeReasonEnum.Licensed}
                  control={<Radio aria-label='licensed' />}
                  className={radioItem}
                  label={
                    <Grid item container XSmall={12}>
                      <Grid item XSmall={12}>
                        <Typography>{translate('Description.DisputeReasonLicensed')}</Typography>
                      </Grid>
                      <Grid item XSmall={12}>
                        <Typography variant='body2' color='secondary'>
                          {translate('Description.DisputeReasonLicensedSub')}
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                />
                <FormControlLabel
                  value={DisputeReasonEnum.FairUse}
                  control={<Radio aria-label='fair use' />}
                  className={radioItem}
                  label={
                    <Grid item container XSmall={12}>
                      <Grid item XSmall={12}>
                        <Typography>{translate('Description.DisputeReasonFair')}</Typography>
                      </Grid>
                      <Grid item XSmall={12}>
                        <Typography variant='body2' color='secondary'>
                          {translateHTML('Description.DisputeReasonFairSub', [
                            {
                              opening: 'linkStart',
                              closing: 'linkEnd',
                              content(chunks) {
                                return (
                                  <Link
                                    href={resolveUrl(
                                      'copyrightFairUseUrl',
                                      process.env.targetEnvironment,
                                      process.env.buildTarget,
                                    )}
                                    noWrap>
                                    {chunks}
                                  </Link>
                                );
                              },
                            },
                          ])}
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                />
                {isDevMarketplace && (
                  <FormControlLabel
                    value={DisputeReasonEnum.IpRemoved}
                    control={<Radio aria-label='ip removed' />}
                    className={radioItem}
                    label={
                      <Grid item container XSmall={12}>
                        <Grid item XSmall={12}>
                          <Typography>{translate('Description.DisputeReasonRemoved')}</Typography>
                        </Grid>
                        <Grid item XSmall={12}>
                          <Typography variant='body2' color='secondary'>
                            {translate('Description.DisputeReasonRemovedSub')}
                          </Typography>
                        </Grid>
                      </Grid>
                    }
                  />
                )}
              </RadioGroup>
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );
}

export default withTranslation(ReasonForm, [TranslationNamespace.RightsPortal]);

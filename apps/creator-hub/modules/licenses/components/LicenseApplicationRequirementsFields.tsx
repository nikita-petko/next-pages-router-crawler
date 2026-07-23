import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import type { Control, UseFormTrigger } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, type LicenseType } from '@rbx/client-content-licensing-api/v1';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { foundationRadioLabel } from '@modules/ip/license-manager/agreements/components/foundationRadioLabel';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import useApplyToLicenseContainerStyles from '../containers/ApplyToLicenseContainer.styles';
import {
  MIN_LICENSE_START_DATE_LEAD_DAYS,
  MAX_DATE_SELECTOR_LOOKAHEAD_MONTHS,
  MS_PER_DAY,
} from '../utils/constants';
import getEarliestSelectableLicenseStartMidnight from '../utils/earliestSelectableLicenseStart';
import { formatRoyaltyRate } from '../utils/format';
import { getApplyFlowRevShareOnActivation } from '../utils/getApplyFlowRevShareOnActivation';
import {
  RevShareTiming,
  revShareTimingFromRadioValue,
} from '../utils/licenseApplicationRequirementsFieldsUtils';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import { EMPTY_COLLABORATION_SALES_AVENUES } from '../utils/salesAvenue';
import CollaborationSalesAvenueFields from './CollaborationSalesAvenueFields';
import DateRangeSelector from './DateRangeSelector';
import RevShareOnActivationNotice from './RevShareOnActivationNotice';

function getNumDaysInRange(start: Date, end: Date): number {
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.floor(Math.abs(endMidnight - startMidnight) / MS_PER_DAY) + 1;
}

export type LicenseApplicationRequirementsFormValues = {
  creatorPitch: string;
  dateRange: { startDate: Date | null; endDate: Date | null } | null | undefined;
};

interface LicenseApplicationRequirementsFieldsProps {
  revShareValue?: number;
  licenseRevShareTiming?: boolean;
  isRevShareNowTimingPreferredInternal: RevShareTiming | undefined;
  onRevShareTimingChange: (timing: RevShareTiming) => void;
  licenseDuration: LicenseDurationResponse | undefined;
  licenseType?: LicenseType;
  enableCollaborationLicensing?: boolean;
  enableMarketplaceSalesLicensing?: boolean;
  control: Control<LicenseApplicationRequirementsFormValues>;
  trigger: UseFormTrigger<LicenseApplicationRequirementsFormValues>;
  showCollaborationSalesAvenueFields?: boolean;
  universeId?: number | null;
  collaborationSalesAvenues?: CollaborationSalesAvenues;
  onCollaborationSalesAvenuesChange?: (salesAvenues: CollaborationSalesAvenues) => void;
  onSalesAvenueStateChange?: (state: { isPending: boolean; isComplete: boolean }) => void;
  showSalesAvenueRequiredErrors?: boolean;
}

/** Non-pitch license application inputs: rev-share timing, date range, and sales avenues. */
const LicenseApplicationRequirementsFields: FunctionComponent<
  LicenseApplicationRequirementsFieldsProps
> = ({
  revShareValue,
  licenseRevShareTiming,
  isRevShareNowTimingPreferredInternal,
  onRevShareTimingChange,
  licenseDuration,
  licenseType,
  enableCollaborationLicensing = false,
  enableMarketplaceSalesLicensing = false,
  control,
  trigger,
  showCollaborationSalesAvenueFields = false,
  universeId = null,
  collaborationSalesAvenues = EMPTY_COLLABORATION_SALES_AVENUES,
  onCollaborationSalesAvenuesChange,
  onSalesAvenueStateChange,
  showSalesAvenueRequiredErrors = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { locale: localizationLocale } = useLocalization();
  const locale = localizationLocale ?? Locale.English;
  const { classes } = useApplyToLicenseContainerStyles();

  const revShareOnActivation = getApplyFlowRevShareOnActivation({
    durationType: licenseDuration?.durationType,
    licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  const showRevSharePreferenceRadio =
    !revShareOnActivation && licenseDuration?.durationType === LicenseDurationType.Perpetual;

  const handleRevShareRadioValueChange = useCallback(
    (value: string) => {
      const next = revShareTimingFromRadioValue(value);
      if (next !== undefined) {
        onRevShareTimingChange(next);
      }
    },
    [onRevShareTimingChange],
  );

  const isNonZeroRevShare = getIsNonZeroRevShareFromValue(revShareValue);

  const revShareNowRadioButton = useMemo(
    () =>
      isNonZeroRevShare ? (
        <>
          <Typography variant='smallLabel2' component='div' gutterBottom>
            {translate('Label.CreationReadyNow')}
          </Typography>
          <Typography variant='body2' color='secondary' component='div'>
            {translate('Label.SelectRevShareNow')}
          </Typography>
        </>
      ) : (
        <Typography variant='body1'>{translate('Label.CreationReadyNow')}</Typography>
      ),
    [isNonZeroRevShare, translate],
  );

  const revShareLaterRadioButton = useMemo(
    () =>
      isNonZeroRevShare ? (
        <>
          <Typography variant='smallLabel2' component='div' gutterBottom>
            {translate('Label.CreationReadyLater')}
          </Typography>
          <Typography variant='body2' color='secondary' component='div'>
            {translate('Label.SelectRevShareLater')}
          </Typography>
        </>
      ) : (
        <Typography variant='body1'>{translate('Label.CreationReadyLater')}</Typography>
      ),
    [isNonZeroRevShare, translate],
  );

  const descriptionText = useMemo((): ReactNode => {
    if (isNonZeroRevShare) {
      return translateHTML(
        licenseRevShareTiming
          ? 'Description.RevShareTimingNowWithValue'
          : 'Description.RevShareTimingLaterWithValue',
        [
          {
            opening: 'boldStart',
            closing: 'boldEnd',
            content(chunks) {
              return <strong>{chunks}</strong>;
            },
          },
        ],
        {
          value: formatRoyaltyRate(revShareValue),
        },
      );
    }
    return translate('Description.CreationReadiness');
  }, [isNonZeroRevShare, licenseRevShareTiming, revShareValue, translateHTML, translate]);

  return (
    <>
      {showRevSharePreferenceRadio && (
        <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
          <Grid item>
            <Typography variant='h6'>{translate('Heading.SelectCreationReadiness')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1'>{descriptionText}</Typography>
          </Grid>
          <Grid item>
            <RadioGroup
              value={isRevShareNowTimingPreferredInternal ?? ''}
              onValueChange={handleRevShareRadioValueChange}
              size='Medium'>
              <div className={classes.radioButton}>
                <Radio
                  value={RevShareTiming.Now}
                  label={foundationRadioLabel(revShareNowRadioButton)}
                />
              </div>
              <div className={classes.radioButton}>
                <Radio
                  value={RevShareTiming.Later}
                  label={foundationRadioLabel(revShareLaterRadioButton)}
                />
              </div>
            </RadioGroup>
          </Grid>
        </Grid>
      )}

      {licenseDuration?.durationType === LicenseDurationType.TimeLimited && (
        <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
          <Grid item>
            <Typography variant='h6'>{translate('Header.DateRangeRequest')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1'>
              {translate('Description.DateRangeRequest', {
                durationRange: getDurationRangeLabel(translate, licenseDuration),
                startDate: getEarliestSelectableLicenseStartMidnight(
                  MIN_LICENSE_START_DATE_LEAD_DAYS,
                ).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
              })}
            </Typography>
          </Grid>
          <Grid item>
            <Controller
              name='dateRange'
              control={control}
              render={({ field, fieldState: { error } }) => {
                const value = field.value ?? undefined;
                return (
                  <DateRangeSelector
                    {...field}
                    value={value}
                    onChange={(range) => {
                      field.onChange(range);
                      void trigger('dateRange');
                    }}
                    label=''
                    fullWidth
                    disablePast
                    minimumLeadDaysBeforeSelectableDate={MIN_LICENSE_START_DATE_LEAD_DAYS}
                    maxLookaheadMonths={MAX_DATE_SELECTOR_LOOKAHEAD_MONTHS}
                    showNumDaysInRange
                    error={!!error}
                    errorText={error?.message ?? undefined}
                  />
                );
              }}
              rules={{
                validate: (value) => {
                  if (!value?.startDate || !value?.endDate) {
                    return translate('Label.FieldIsRequired');
                  }
                  const minMax =
                    licenseDuration?.durationType === LicenseDurationType.TimeLimited
                      ? licenseDuration?.timeBounds?.minMax
                      : undefined;
                  if (minMax && minMax.minDays != null && minMax.maxDays != null) {
                    const numDays = getNumDaysInRange(value.startDate, value.endDate);
                    if (numDays < minMax.minDays) {
                      return translate('Error.DateRangeTooShort');
                    }
                    if (numDays > minMax.maxDays) {
                      return translate('Error.DateRangeTooLarge');
                    }
                  }
                  return true;
                },
              }}
            />
          </Grid>
        </Grid>
      )}

      {revShareOnActivation && (
        <RevShareOnActivationNotice
          revShareValue={revShareValue}
          licenseDuration={licenseDuration}
          licenseType={licenseType}
          enableCollaborationLicensing={enableCollaborationLicensing}
        />
      )}

      {showCollaborationSalesAvenueFields && onCollaborationSalesAvenuesChange && (
        <CollaborationSalesAvenueFields
          universeId={universeId}
          salesAvenues={collaborationSalesAvenues}
          onChange={onCollaborationSalesAvenuesChange}
          onStateChange={onSalesAvenueStateChange}
          showRequiredErrors={showSalesAvenueRequiredErrors}
        />
      )}
    </>
  );
};

export default LicenseApplicationRequirementsFields;

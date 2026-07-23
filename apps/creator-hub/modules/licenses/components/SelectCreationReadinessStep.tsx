import { FunctionComponent, useState, useCallback, useMemo } from 'react';
import { Button, FormControlLabel, Grid, Link, Radio, RadioGroup, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Flex } from '@modules/miscellaneous/common/components';
import {
  TextFieldWithEnhancedHelperText,
  getMinMaxLengthValidationRule,
} from '@modules/ip/components/TextFieldWithEnhancedHelperText';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { Controller, useForm } from 'react-hook-form';
import {
  LicenseDurationResponse,
  LicenseDurationType,
  ModerationStatus,
  type RejectionReason,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';

import { formatRoyaltyRate } from '../utils/format';
import useApplyToLicenseContainerStyles from '../containers/ApplyToLicenseContainer.styles';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';
import { MIN_CREATOR_PITCH_LENGTH, MAX_CREATOR_PITCH_LENGTH, MS_PER_DAY } from '../utils/constants';
import useContentModerationMutation from '../hooks/useContentModerationMutation';
import getKeyFromModerationReason from '../utils/moderationReason';
import { CREATOR_PITCH_HREF } from '../urls';
import DateRangeSelector from './DateRangeSelector';

function getNumDaysInRange(start: Date, end: Date): number {
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.floor(Math.abs(endMidnight - startMidnight) / MS_PER_DAY) + 1;
}

function isStartDateWithinThreeDaysOfToday(startDate: Date): boolean {
  const today = new Date();
  const startMidnight = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  ).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysFromToday = Math.floor((startMidnight - todayMidnight) / MS_PER_DAY);
  return daysFromToday >= 0 && daysFromToday <= 3;
}

enum RevShareTiming {
  Now = 'rev-share-now',
  Later = 'rev-share-later',
  NoPreference = 'no-preference',
}

interface SelectCreationReadinessStepProps {
  setRevShareNowTimingPreference: (isRevShareNowTimingPreferredSelected: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  isRevShareNowTimingPreferred?: boolean;
  revShareValue?: number;
  licenseRevShareTiming?: boolean;
  creatorPitch: string | undefined;
  setCreatorPitch: (newPitch: string) => void;
  licenseDuration: LicenseDurationResponse | undefined;
  dateRange?: { startDate: Date | null; endDate: Date | null } | undefined;
  setDateRange: (range: { startDate: Date | null; endDate: Date | null } | undefined) => void;
}

/** A component that displays a step in the request license flow where the user selects how ready
 * their creation is to using the IP they're requesting.
 *
 * For non-zero rev-share licenses, we want to have Creators understand the relationship of a
 * creation's readiness to use the IP with the monetization timing of that IP's rev-share.
 *
 * For zero rev-share licenses, we hide mention of rev-share timing entirely.
 */
const SelectCreationReadinessStep: FunctionComponent<SelectCreationReadinessStepProps> = ({
  revShareValue,
  licenseRevShareTiming,
  isRevShareNowTimingPreferred,
  setRevShareNowTimingPreference,
  creatorPitch,
  setCreatorPitch,
  licenseDuration,
  dateRange,
  setDateRange,
  onNext,
  onPrev,
  onCancel,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useApplyToLicenseContainerStyles();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.SelectCreationReadinessStepImpressionEvent, {
    hasNonZeroRevShare: getIsNonZeroRevShareFromValue(revShareValue),
  });

  const getTimingPreference = (userPreference?: boolean) => {
    if (typeof userPreference === 'boolean') {
      // Preference has been set, so use that
      return userPreference ? RevShareTiming.Now : RevShareTiming.Later;
    }
    // Preference is not yet set, so check if this license has a non-zero rev-share value
    // then use the license's preference instead
    if (getIsNonZeroRevShareFromValue(revShareValue)) {
      return licenseRevShareTiming ? RevShareTiming.Now : RevShareTiming.Later;
    }
    // Licenses with zero rev-share value don't have a preference for timing
    return RevShareTiming.NoPreference;
  };
  const [isRevShareNowTimingPreferredInternal, setisRevShareNowTimingPreferredInternal] = useState<
    RevShareTiming | undefined
  >(getTimingPreference(isRevShareNowTimingPreferred));

  const { control, handleSubmit, getValues, trigger } = useForm({
    defaultValues: {
      creatorPitch: creatorPitch || '',
      dateRange: enableIpPlatformTimeboundLicenses ? dateRange : null,
    },
  });

  const [moderationError, setModerationError] = useState<string | undefined>(undefined);
  const contentModerationMutation = useContentModerationMutation();

  const onClickNext = useCallback(async () => {
    setRevShareNowTimingPreference(isRevShareNowTimingPreferredInternal === RevShareTiming.Now);

    const formValues = getValues();
    const { response } = await contentModerationMutation.mutateAsync(formValues.creatorPitch);
    if (response.status === ModerationStatus.Accepted) {
      setCreatorPitch(formValues.creatorPitch);
      if (enableIpPlatformTimeboundLicenses) {
        setDateRange(formValues.dateRange ?? undefined);
      }
      setModerationError(undefined);
      onNext();
    } else {
      const reason = response.reason ? (response.reason as RejectionReason) : undefined;
      setModerationError(translate(getKeyFromModerationReason(reason)));
    }
  }, [
    setRevShareNowTimingPreference,
    isRevShareNowTimingPreferredInternal,
    getValues,
    contentModerationMutation,
    setCreatorPitch,
    enableIpPlatformTimeboundLicenses,
    onNext,
    setDateRange,
    translate,
  ]);

  const onClickPrev = useCallback(() => {
    setRevShareNowTimingPreference(isRevShareNowTimingPreferredInternal === RevShareTiming.Now);

    const formValues = getValues();
    setCreatorPitch(formValues.creatorPitch);
    if (enableIpPlatformTimeboundLicenses) {
      setDateRange(formValues.dateRange ?? undefined);
    }
    setModerationError(undefined);

    onPrev();
  }, [
    setRevShareNowTimingPreference,
    isRevShareNowTimingPreferredInternal,
    getValues,
    setCreatorPitch,
    enableIpPlatformTimeboundLicenses,
    onPrev,
    setDateRange,
  ]);

  const handleRadioButtonChange = useCallback((timingEnum: RevShareTiming) => {
    setisRevShareNowTimingPreferredInternal(timingEnum);
  }, []);

  const isNonZeroRevShare = useMemo(
    () => getIsNonZeroRevShareFromValue(revShareValue),
    [revShareValue],
  );

  const revShareNowRadioButton = useMemo(
    () =>
      isNonZeroRevShare ? (
        <Flex flexDirection='column'>
          <Typography variant='smallLabel2'>{translate('Label.CreationReadyNow')}</Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Label.SelectRevShareNow')}
          </Typography>
        </Flex>
      ) : (
        <Flex flexDirection='column'>
          <Typography variant='body1'>{translate('Label.CreationReadyNow')}</Typography>
        </Flex>
      ),
    [isNonZeroRevShare, translate],
  );

  const revShareLaterRadioButton = useMemo(
    () =>
      isNonZeroRevShare ? (
        <Flex flexDirection='column'>
          <Typography variant='smallLabel2'>{translate('Label.CreationReadyLater')}</Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Label.SelectRevShareLater')}
          </Typography>
        </Flex>
      ) : (
        <Flex flexDirection='column'>
          <Typography variant='body1'>{translate('Label.CreationReadyLater')}</Typography>
        </Flex>
      ),
    [isNonZeroRevShare, translate],
  );

  const descriptionText = useMemo(() => {
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

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Grid container flexDirection='column' padding={1.5} spacing={2} width='50%'>
      <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
        <Grid item>
          <Typography variant='h6'>{translate('Heading.TellUsMore')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1'>
            {translateHTML('Description.CreatorPitchWithLink', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={CREATOR_PITCH_HREF}
                      target='_blank'
                      style={{ textDecoration: 'underline' }}
                      color='inherit'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid
          item
          data-testid={moderationError ? 'apply-to-license-creator-pitch-error' : undefined}>
          <Controller
            name='creatorPitch'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                id='creator-pitch'
                label={translate('Label.Description')}
                placeholder={translate('Label.CreatorPitchPlaceholder')}
                fullWidth
                multiline
                minRows={3}
                maxRows={15}
                error={!!error || !!moderationError}
                helperText={error?.message || moderationError}
                maxLength={MAX_CREATOR_PITCH_LENGTH}
                showCharacterCount
                inputProps={{ 'data-testid': 'apply-to-license-creator-pitch' }}
                onChange={(e) => {
                  field.onChange(e);
                  if (moderationError) {
                    setModerationError(undefined);
                  }
                }}
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMinMaxLengthValidationRule(
                MIN_CREATOR_PITCH_LENGTH,
                MAX_CREATOR_PITCH_LENGTH,
                translate,
              ),
            }}
          />
        </Grid>
      </Grid>

      {(!enableIpPlatformTimeboundLicenses ||
        (enableIpPlatformTimeboundLicenses &&
          licenseDuration?.durationType === LicenseDurationType.Perpetual)) && (
        <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
          <Grid item>
            <Typography variant='h6'>{translate('Heading.SelectCreationReadiness')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1'>{descriptionText}</Typography>
          </Grid>
          <Grid item>
            <RadioGroup
              value={isRevShareNowTimingPreferredInternal}
              onChange={(event) => handleRadioButtonChange(event.target.value as RevShareTiming)}>
              <FormControlLabel
                className={classes.radioButton}
                value={RevShareTiming.Now}
                control={<Radio aria-label={translate('Label.CreationReadyNow')} />}
                label={revShareNowRadioButton}
              />
              <FormControlLabel
                className={classes.radioButton}
                value={RevShareTiming.Later}
                control={<Radio aria-label={translate('Label.CreationReadyLater')} />}
                label={revShareLaterRadioButton}
              />
            </RadioGroup>
          </Grid>
        </Grid>
      )}

      {enableIpPlatformTimeboundLicenses &&
        licenseDuration?.durationType === LicenseDurationType.TimeLimited && (
          <Grid
            item
            container
            flexDirection='column'
            alignItems='left'
            paddingBottom={1}
            spacing={2}>
            <Grid item>
              <Typography variant='h6'>{translate('Header.DateRangeRequest')}</Typography>
            </Grid>
            <Grid item>
              <Typography variant='body1'>
                {translate('Description.DateRangeRequest', {
                  durationRange: getDurationRangeLabel(translate, licenseDuration),
                })}
              </Typography>
            </Grid>
            <Grid item>
              <Controller
                name='dateRange'
                control={control}
                render={({ field, fieldState: { error } }) => {
                  const value = field.value ?? undefined;
                  const hasRange = value?.startDate && value?.endDate;
                  const showStartDateWarning =
                    hasRange &&
                    value.startDate &&
                    isStartDateWithinThreeDaysOfToday(value.startDate);
                  const helperText = showStartDateWarning
                    ? translate('Label.DateRangeSelectorStartDateNearTodayHelperText')
                    : undefined;
                  return (
                    <DateRangeSelector
                      {...field}
                      value={value}
                      onChange={(range) => {
                        field.onChange(range);
                        trigger('dateRange');
                      }}
                      label=''
                      fullWidth
                      disablePast
                      maxLookaheadMonths={6}
                      showNumDaysInRange
                      error={!!error}
                      errorText={error?.message ?? undefined}
                      helperText={helperText}
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

      {enableIpPlatformTimeboundLicenses &&
        licenseDuration?.durationType === LicenseDurationType.TimeLimited && (
          <Grid
            item
            container
            flexDirection='column'
            alignItems='left'
            paddingBottom={1}
            spacing={2}>
            <Grid item>
              <Typography variant='h6'>{translate('Label.RevShareTiming')}</Typography>
            </Grid>
            <Grid item>
              <Typography variant='body1'>
                {getIsNonZeroRevShareFromValue(revShareValue)
                  ? translate('Description.TimeLimitedRevShareTimingWithValue', {
                      value: formatRoyaltyRate(revShareValue),
                    })
                  : translate('Description.TimeLimitedLicenseZeroRevShare')}
              </Typography>
            </Grid>
          </Grid>
        )}

      {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
      <Grid item marginTop={6}>
        <Flex flexDirection='row' gap={10}>
          <Button
            variant='text'
            color='secondary'
            onClick={onCancel}
            data-testid='apply-to-license-step-cancel'>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={onClickPrev}
            data-testid='apply-to-license-step-back'>
            {translate('Action.Back')}
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit(onClickNext)}
            loading={contentModerationMutation.isPending}
            data-testid='apply-to-license-step-next'>
            {translate('Action.Next')}
          </Button>
        </Flex>
      </Grid>
    </Grid>
  );
};

export default SelectCreationReadinessStep;

import type { FunctionComponent } from 'react';
import { useState, useCallback, useContext } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import {
  LicenseDurationType,
  LicenseType,
  ModerationStatus,
} from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Link, Typography } from '@rbx/ui';
import {
  TextFieldWithEnhancedHelperText,
  getMinMaxLengthValidationRule,
} from '@modules/ip/components/TextFieldWithEnhancedHelperText';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useContentModerationMutation from '../hooks/useContentModerationMutation';
import { CREATOR_PITCH_HREF } from '../urls';
import { MIN_CREATOR_PITCH_LENGTH, MAX_CREATOR_PITCH_LENGTH } from '../utils/constants';
import { getApplyFlowRevShareOnActivation } from '../utils/getApplyFlowRevShareOnActivation';
import {
  getRevShareTimingPreference,
  isRevShareNowTimingPreferred as getIsRevShareNowTimingPreferred,
  type RevShareTiming,
} from '../utils/licenseApplicationRequirementsFieldsUtils';
import getKeyFromModerationReason from '../utils/moderationReason';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import { hasResolvedSalesAvenue } from '../utils/salesAvenue';
import type { LicenseApplicationRequirementsFormValues } from './LicenseApplicationRequirementsFields';
import LicenseApplicationRequirementsFields from './LicenseApplicationRequirementsFields';

export type SelectCreationReadinessContentMode = 'full' | 'pitchOnly';

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
  licenseType?: LicenseType;
  enableCollaborationLicensing?: boolean;
  enableMarketplaceSalesLicensing?: boolean;
  collaborationSalesAvenues: CollaborationSalesAvenues;
  setCollaborationSalesAvenues: (salesAvenues: CollaborationSalesAvenues) => void;
  contentMode?: SelectCreationReadinessContentMode;
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
  licenseType,
  enableCollaborationLicensing = false,
  enableMarketplaceSalesLicensing = false,
  collaborationSalesAvenues,
  setCollaborationSalesAvenues,
  contentMode = 'full',
  onNext,
  onPrev,
  onCancel,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { isFetched } = useSettings();
  const { selectedExperienceId } = useContext(SelectedExperienceContext);
  const isPitchOnly = contentMode === 'pitchOnly';
  const showCollaborationSalesAvenueFields =
    !isPitchOnly &&
    enableCollaborationLicensing &&
    licenseType === LicenseType.CollaborationInExperienceSale;
  const [salesAvenueState, setSalesAvenueState] = useState({
    isPending: false,
    isComplete: false,
  });
  const [showSalesAvenueRequiredErrors, setShowSalesAvenueRequiredErrors] = useState(false);

  const revShareOnActivation = getApplyFlowRevShareOnActivation({
    durationType: licenseDuration?.durationType,
    licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.SelectCreationReadinessStepImpressionEvent, {
    hasNonZeroRevShare: getIsNonZeroRevShareFromValue(revShareValue),
  });

  const [isRevShareNowTimingPreferredInternal, setisRevShareNowTimingPreferredInternal] = useState<
    RevShareTiming | undefined
  >(
    getRevShareTimingPreference(revShareValue, licenseRevShareTiming, isRevShareNowTimingPreferred),
  );

  const { control, getValues, trigger } = useForm<LicenseApplicationRequirementsFormValues>({
    defaultValues: {
      creatorPitch: creatorPitch ?? '',
      dateRange,
    },
  });

  const [moderationError, setModerationError] = useState<string | undefined>(undefined);
  const contentModerationMutation = useContentModerationMutation();

  const persistRevShareNowTimingPreference = useCallback(() => {
    setRevShareNowTimingPreference(
      getIsRevShareNowTimingPreferred(revShareOnActivation, isRevShareNowTimingPreferredInternal),
    );
  }, [isRevShareNowTimingPreferredInternal, revShareOnActivation, setRevShareNowTimingPreference]);

  const onClickNext = useCallback(async () => {
    if (!isPitchOnly) {
      if (showCollaborationSalesAvenueFields && salesAvenueState.isPending) {
        return;
      }

      const hasResolvedSalesAvenueSelection = hasResolvedSalesAvenue(collaborationSalesAvenues);

      let salesAvenuesValid = true;
      if (showCollaborationSalesAvenueFields && !hasResolvedSalesAvenueSelection) {
        setShowSalesAvenueRequiredErrors(true);
        salesAvenuesValid = false;
      }

      const formValid = await trigger();
      if (!formValid || !salesAvenuesValid) {
        return;
      }

      persistRevShareNowTimingPreference();
    } else {
      const formValid = await trigger('creatorPitch');
      if (!formValid) {
        return;
      }
    }

    const formValues = getValues();
    const { response } = await contentModerationMutation.mutateAsync(formValues.creatorPitch);
    if (response.status === ModerationStatus.Accepted) {
      setCreatorPitch(formValues.creatorPitch);
      if (!isPitchOnly && licenseDuration?.durationType === LicenseDurationType.TimeLimited) {
        setDateRange(formValues.dateRange ?? undefined);
      }
      setModerationError(undefined);
      onNext();
    } else {
      const reason = response.reason ?? undefined;
      setModerationError(translate(getKeyFromModerationReason(reason)));
    }
  }, [
    isPitchOnly,
    showCollaborationSalesAvenueFields,
    salesAvenueState.isPending,
    collaborationSalesAvenues,
    persistRevShareNowTimingPreference,
    getValues,
    contentModerationMutation,
    setCreatorPitch,
    licenseDuration?.durationType,
    onNext,
    setDateRange,
    translate,
    trigger,
  ]);

  const onClickPrev = useCallback(() => {
    if (!isPitchOnly) {
      persistRevShareNowTimingPreference();
    }

    const formValues = getValues();
    setCreatorPitch(formValues.creatorPitch);
    if (!isPitchOnly && licenseDuration?.durationType === LicenseDurationType.TimeLimited) {
      setDateRange(formValues.dateRange ?? undefined);
    }
    setModerationError(undefined);

    onPrev();
  }, [
    isPitchOnly,
    persistRevShareNowTimingPreference,
    getValues,
    setCreatorPitch,
    licenseDuration?.durationType,
    onPrev,
    setDateRange,
  ]);

  const handleRevShareTimingChange = useCallback((timingEnum: RevShareTiming) => {
    setisRevShareNowTimingPreferredInternal(timingEnum);
  }, []);

  const handleCollaborationSalesAvenuesChange = useCallback(
    (nextSalesAvenues: CollaborationSalesAvenues) => {
      setShowSalesAvenueRequiredErrors(false);
      setCollaborationSalesAvenues(nextSalesAvenues);
    },
    [setCollaborationSalesAvenues],
  );

  const handleClickNext = useCallback(() => {
    void onClickNext();
  }, [onClickNext]);

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
                helperText={error?.message ?? moderationError}
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

      {!isPitchOnly && (
        <LicenseApplicationRequirementsFields
          revShareValue={revShareValue}
          licenseRevShareTiming={licenseRevShareTiming}
          isRevShareNowTimingPreferredInternal={isRevShareNowTimingPreferredInternal}
          onRevShareTimingChange={handleRevShareTimingChange}
          licenseDuration={licenseDuration}
          licenseType={licenseType}
          enableCollaborationLicensing={enableCollaborationLicensing}
          enableMarketplaceSalesLicensing={enableMarketplaceSalesLicensing}
          control={control}
          trigger={trigger}
          showCollaborationSalesAvenueFields={showCollaborationSalesAvenueFields}
          universeId={selectedExperienceId}
          collaborationSalesAvenues={collaborationSalesAvenues}
          onCollaborationSalesAvenuesChange={handleCollaborationSalesAvenuesChange}
          onSalesAvenueStateChange={setSalesAvenueState}
          showSalesAvenueRequiredErrors={showSalesAvenueRequiredErrors}
        />
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
            onClick={handleClickNext}
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

import type { FunctionComponent } from 'react';
import { useCallback, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useSalesAvenueStepValidation from '../hooks/useSalesAvenueStepValidation';
import { getApplyFlowRevShareOnActivation } from '../utils/getApplyFlowRevShareOnActivation';
import {
  getRevShareTimingPreference,
  isRevShareNowTimingPreferred as getIsRevShareNowTimingPreferred,
  isRevSharePreferenceSelectionIncomplete,
  type RevShareTiming,
} from '../utils/licenseApplicationRequirementsFieldsUtils';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import type { LicenseApplicationRequirementsFormValues } from './LicenseApplicationRequirementsFields';
import LicenseApplicationRequirementsFields from './LicenseApplicationRequirementsFields';

interface SetLicenseRequirementsStepProps {
  revShareValue?: number;
  licenseRevShareTiming?: boolean;
  isRevShareNowTimingPreferred?: boolean;
  setRevShareNowTimingPreference: (isRevShareNowTimingPreferredSelected: boolean) => void;
  licenseDuration: LicenseDurationResponse | undefined;
  licenseType?: LicenseType;
  enableCollaborationLicensing?: boolean;
  enableMarketplaceSalesLicensing?: boolean;
  dateRange?: { startDate: Date | null; endDate: Date | null } | undefined;
  setDateRange: (range: { startDate: Date | null; endDate: Date | null } | undefined) => void;
  collaborationSalesAvenues: CollaborationSalesAvenues;
  setCollaborationSalesAvenues: (salesAvenues: CollaborationSalesAvenues) => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

function shouldShowCollaborationSalesAvenueFields(
  enableCollaborationLicensing: boolean,
  licenseType: LicenseType | undefined,
): boolean {
  return enableCollaborationLicensing && licenseType === LicenseType.CollaborationInExperienceSale;
}

/** Apply-flow step for rev-share timing, date range, and collaboration sales avenue requirements. */
const SetLicenseRequirementsStep: FunctionComponent<SetLicenseRequirementsStepProps> = ({
  revShareValue,
  licenseRevShareTiming,
  isRevShareNowTimingPreferred,
  setRevShareNowTimingPreference,
  licenseDuration,
  licenseType,
  enableCollaborationLicensing = false,
  enableMarketplaceSalesLicensing = false,
  dateRange,
  setDateRange,
  collaborationSalesAvenues,
  setCollaborationSalesAvenues,
  onNext,
  onPrev,
  onCancel,
}) => {
  const { translate } = useTranslation();
  const { isFetched } = useSettings();
  const { selectedExperienceId } = useContext(SelectedExperienceContext);

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.SetLicenseRequirementsStepImpressionEvent);

  const isTimeLimitedLicense = licenseDuration?.durationType === LicenseDurationType.TimeLimited;

  const revShareOnActivation = getApplyFlowRevShareOnActivation({
    durationType: licenseDuration?.durationType,
    licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  const showCollaborationSalesAvenueFields = shouldShowCollaborationSalesAvenueFields(
    enableCollaborationLicensing,
    licenseType,
  );

  const [isRevShareNowTimingPreferredInternal, setIsRevShareNowTimingPreferredInternal] = useState<
    RevShareTiming | undefined
  >(
    getRevShareTimingPreference(revShareValue, licenseRevShareTiming, isRevShareNowTimingPreferred),
  );

  const salesAvenueValidation = useSalesAvenueStepValidation({
    enabled: showCollaborationSalesAvenueFields,
    salesAvenues: collaborationSalesAvenues,
    onChange: setCollaborationSalesAvenues,
  });
  const { isNextDisabled, validate: validateSalesAvenues } = salesAvenueValidation;

  const { control, getValues, trigger } = useForm<LicenseApplicationRequirementsFormValues>({
    defaultValues: {
      creatorPitch: '',
      dateRange,
    },
  });

  const persistRevShareNowTimingPreference = useCallback(() => {
    setRevShareNowTimingPreference(
      getIsRevShareNowTimingPreferred(revShareOnActivation, isRevShareNowTimingPreferredInternal),
    );
  }, [isRevShareNowTimingPreferredInternal, revShareOnActivation, setRevShareNowTimingPreference]);

  const persistRequirementsState = useCallback(() => {
    persistRevShareNowTimingPreference();
    if (isTimeLimitedLicense) {
      setDateRange(getValues().dateRange ?? undefined);
    }
  }, [getValues, isTimeLimitedLicense, persistRevShareNowTimingPreference, setDateRange]);

  const onClickNext = useCallback(async () => {
    if (isNextDisabled) {
      return;
    }

    if (
      isRevSharePreferenceSelectionIncomplete({
        revShareValue,
        revShareOnActivation,
        durationType: licenseDuration?.durationType,
        revShareTiming: isRevShareNowTimingPreferredInternal,
      })
    ) {
      return;
    }

    if (!validateSalesAvenues()) {
      return;
    }

    if (isTimeLimitedLicense) {
      const dateRangeValid = await trigger('dateRange');
      if (!dateRangeValid) {
        return;
      }
    }

    persistRequirementsState();
    onNext();
  }, [
    isRevShareNowTimingPreferredInternal,
    isTimeLimitedLicense,
    licenseDuration?.durationType,
    onNext,
    persistRequirementsState,
    revShareOnActivation,
    revShareValue,
    isNextDisabled,
    trigger,
    validateSalesAvenues,
  ]);

  const onClickPrev = useCallback(() => {
    persistRequirementsState();
    onPrev();
  }, [onPrev, persistRequirementsState]);

  const handleNextClick = useCallback(() => {
    void onClickNext();
  }, [onClickNext]);

  const handleRevShareTimingChange = useCallback((timingEnum: RevShareTiming) => {
    setIsRevShareNowTimingPreferredInternal(timingEnum);
  }, []);

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Grid container flexDirection='column' padding={1.5} spacing={2} width='50%'>
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
        onCollaborationSalesAvenuesChange={salesAvenueValidation.handleChange}
        onSalesAvenueStateChange={salesAvenueValidation.setState}
        showSalesAvenueRequiredErrors={salesAvenueValidation.showRequiredErrors}
        showSalesAvenueUnsubmittedErrors={salesAvenueValidation.showUnsubmittedErrors}
        onSalesAvenueUnsubmittedErrorReset={salesAvenueValidation.resetUnsubmittedErrors}
      />

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
            onClick={handleNextClick}
            disabled={isNextDisabled}
            data-testid='apply-to-license-step-next'>
            {translate('Action.Next')}
          </Button>
        </Flex>
      </Grid>
    </Grid>
  );
};

export default SetLicenseRequirementsStep;

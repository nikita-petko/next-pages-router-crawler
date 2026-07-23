import React, { FunctionComponent, useCallback, useContext } from 'react';
import { Button, Grid, Typography } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { Flex } from '@modules/miscellaneous/common/components';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { getDateRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { LicenseDurationType, LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { PageLoading } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';

import SelectedExperienceContext from '../context/SelectedExperienceContext';
import ExperienceSummaryCardContainer from './ExperienceSummaryCardContainer';
import ApplicationSubmissionModal from './ApplicationSubmissionModal';
import LicenseSummaryCardContainer from './LicenseSummaryCardContainer';
import useApplyToPublicLicenseMutation from '../hooks/useApplyToLicenseMutation';

interface SubmitApplicationStepProps {
  onPrev: () => void;
  onCancel: () => void;
  license: LicenseResponse;
  listingId: string;
  creatorPitch: string;
  dateRange?: { startDate: Date | null; endDate: Date | null } | undefined;
  enableMonetization?: boolean;
  logClickEvent?: (eventName: LicenseManagerClickEvent) => void;
}

/** A component that displays a step in the request license flow where the user submits their application for the license. */
const SubmitApplicationStep: FunctionComponent<SubmitApplicationStepProps> = ({
  onPrev,
  onCancel,
  license,
  listingId,
  creatorPitch,
  dateRange,
  enableMonetization,
  logClickEvent,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const context = useContext(SelectedExperienceContext);
  const { selectedExperienceId } = context;

  const applyToLicenseMutation = useApplyToPublicLicenseMutation(
    license.id!,
    enableIpPlatformTimeboundLicenses &&
      license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
      ? true // Enforce rev-share on activation for timelimited licenses
      : (enableMonetization ?? false),
  );

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.ReviewAndSubmitLicenseRequestStepImpressionEvent, {
    licenseId: license.id!,
    experienceId: selectedExperienceId!,
  });

  const onClickSubmit = useCallback(async () => {
    if (logClickEvent) {
      logClickEvent(LicenseManagerClickEvent.SubmitLicenseRequestClickEvent);
    }
    if (selectedExperienceId) {
      const pitch = creatorPitch.trim();
      await applyToLicenseMutation.mutateAsync({
        universeId: selectedExperienceId,
        pitch,
        dateRange:
          enableIpPlatformTimeboundLicenses &&
          license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
            ? dateRange
            : undefined,
      });
    }
  }, [
    logClickEvent,
    selectedExperienceId,
    creatorPitch,
    applyToLicenseMutation,
    enableIpPlatformTimeboundLicenses,
    license.licenseDuration,
    dateRange,
  ]);

  if (!selectedExperienceId) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <React.Fragment>
      <Grid container flexDirection='column' padding={1.5} spacing={2}>
        <Grid item container flexDirection='column'>
          <Grid item>
            <Typography variant='h6'>{translate('Description.ReviewApplication')}</Typography>
          </Grid>
          <Grid item flexDirection='column' marginTop={6} marginBottom={4}>
            <Typography variant='h5' color='primary'>
              {translate('Label.SelectedLicense')}
            </Typography>
            <LicenseSummaryCardContainer license={license} listingId={listingId} />
          </Grid>
          <Grid item flexDirection='column' marginTop={2}>
            <Typography variant='h5' color='primary'>
              {translate('Label.SelectedCreation')}
            </Typography>
            <ExperienceSummaryCardContainer experienceId={selectedExperienceId} />
          </Grid>
          <Grid item flexDirection='column' marginTop={2}>
            <KeyValuePairContainer>
              <KeyValuePair
                label={translate('Label.CreatorIntentOfUse')}
                value={<Typography whiteSpace='pre-wrap'>{creatorPitch}</Typography>}
              />
              {enableIpPlatformTimeboundLicenses && dateRange && (
                <KeyValuePair
                  label={translate('Header.DateRangeRequest')}
                  value={getDateRangeLabel(
                    dateRange.startDate,
                    dateRange.endDate,
                    locale ?? Locale.English,
                  )}
                />
              )}
            </KeyValuePairContainer>
          </Grid>
        </Grid>
        {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
        <Grid item marginTop={6}>
          <Flex flexDirection='row' gap={10}>
            <Button
              variant='text'
              color='secondary'
              onClick={onCancel}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={onPrev}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending}>
              {translate('Action.Back')}
            </Button>
            <Button
              variant='contained'
              onClick={onClickSubmit}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending}
              data-testid='apply-to-license-submit'>
              {translate('Action.Submit')}
            </Button>
          </Flex>
        </Grid>
      </Grid>
      {applyToLicenseMutation.isError && (
        <Grid item>
          <Typography variant='body2' color='error'>
            {translate('Label.FailedToSubmitApplication')}
          </Typography>
        </Grid>
      )}
      <ApplicationSubmissionModal
        isOpen={applyToLicenseMutation.isSuccess}
        logClickEvent={logClickEvent}
      />
    </React.Fragment>
  );
};

export default SubmitApplicationStep;

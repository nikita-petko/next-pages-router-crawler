import type { FunctionComponent } from 'react';
import React, { useCallback, useContext } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
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
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import Flex from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useApplyToPublicLicenseMutation from '../hooks/useApplyToLicenseMutation';
import { getApplyFlowRevShareOnActivation } from '../utils/getApplyFlowRevShareOnActivation';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import { hasResolvedSalesAvenue } from '../utils/salesAvenue';
import ApplicationSubmissionModal from './ApplicationSubmissionModal';
import ExperienceSummaryCardContainer from './ExperienceSummaryCardContainer';
import LicenseSummaryCardContainer from './LicenseSummaryCardContainer';
import SalesAvenueResolvedTile from './SalesAvenueResolvedTile';

interface SubmitApplicationStepProps {
  onPrev: () => void;
  onCancel: () => void;
  license: LicenseResponse;
  listingId: string;
  creatorPitch: string;
  dateRange?: { startDate: Date | null; endDate: Date | null } | undefined;
  enableMonetization?: boolean;
  enableCollaborationLicensing?: boolean;
  enableMarketplaceSalesLicensing?: boolean;
  collaborationSalesAvenues?: CollaborationSalesAvenues;
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
  enableCollaborationLicensing = false,
  enableMarketplaceSalesLicensing = false,
  collaborationSalesAvenues,
  logClickEvent,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { isFetched } = useSettings();

  const context = useContext(SelectedExperienceContext);
  const { selectedExperienceId } = context;
  const licenseId = license.id;

  const revShareOnActivation = getApplyFlowRevShareOnActivation({
    durationType: license.licenseDuration?.durationType,
    licenseType: license.licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  const showCollaborationSalesAvenueFields =
    enableCollaborationLicensing &&
    license.licenseType === LicenseType.CollaborationInExperienceSale;

  const applyToLicenseMutation = useApplyToPublicLicenseMutation(
    licenseId ?? '',
    revShareOnActivation ? true : (enableMonetization ?? false),
    enableCollaborationLicensing,
    license.licenseType,
  );

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  if (licenseId && selectedExperienceId) {
    logOnce(LicenseManagerImpressionEvent.ReviewAndSubmitLicenseRequestStepImpressionEvent, {
      licenseId,
      experienceId: selectedExperienceId,
    });
  }

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
          license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
            ? dateRange
            : undefined,
        collaborationSalesAvenues: showCollaborationSalesAvenueFields
          ? collaborationSalesAvenues
          : undefined,
      });
    }
  }, [
    logClickEvent,
    selectedExperienceId,
    creatorPitch,
    applyToLicenseMutation,
    license.licenseDuration,
    dateRange,
    showCollaborationSalesAvenueFields,
    collaborationSalesAvenues,
  ]);

  if (!selectedExperienceId || !licenseId) {
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
    <>
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
              {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited &&
                dateRange && (
                  <KeyValuePair
                    label={translate('Header.DateRangeRequest')}
                    value={getDateRangeLabel(
                      dateRange.startDate,
                      dateRange.endDate,
                      locale ?? Locale.English,
                    )}
                  />
                )}
              {showCollaborationSalesAvenueFields &&
                collaborationSalesAvenues &&
                hasResolvedSalesAvenue(collaborationSalesAvenues) && (
                  <KeyValuePair
                    label={translate('Label.CollaborationLicenseRevenueTargetSummary')}
                    value={
                      <Flex flexDirection='column' gap={1}>
                        {collaborationSalesAvenues.developerProducts.map((entry) => (
                          <SalesAvenueResolvedTile
                            key={`developer-product-${entry.id}`}
                            entry={entry}
                            productType='DeveloperProduct'
                          />
                        ))}
                        {collaborationSalesAvenues.gamePasses.map((entry) => (
                          <SalesAvenueResolvedTile
                            key={`game-pass-${entry.id}`}
                            entry={entry}
                            productType='GamePass'
                          />
                        ))}
                      </Flex>
                    }
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
    </>
  );
};

export default SubmitApplicationStep;

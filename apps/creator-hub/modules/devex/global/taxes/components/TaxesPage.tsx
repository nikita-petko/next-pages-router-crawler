import type { FunctionComponent, MouseEvent, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  FeedbackBanner,
  Icon,
  Link,
} from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { WithholdingBasis } from '@modules/clients/creatorTaxApi';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEVEX_TAX_HELP_URL } from '../../constants/externalLinkConstants';
import { useGetWithholdingRate } from '../queries/useGetWithholdingRate';
import {
  CURRENT_TAX_DOCUMENTATION_STATUS,
  type TaxDocumentationStatusVariant,
} from '../utils/taxDocumentationStatus';
import {
  logTaxHubEntryClick,
  mapTaxDocumentationStatusToTelemetryStatus,
  type TaxEntryAction,
} from '../utils/taxTelemetry';

const TAX_SUBMISSION_ROUTE = '/dashboard/devex/taxes/taxsubmission';
const NEW_TAX_FORM_ROUTE = `${TAX_SUBMISSION_ROUTE}?forceNewForm=1`;
const TAX_SUPPORT_URL = `https://${process.env.robloxSiteDomain}/support`;
const BASIS_POINTS_PER_PERCENT = 100;
const fitContentButtonStyle = { width: 'fit-content' };
const statusBadgeStyle = {
  backgroundColor: 'var(--color-shift-200)',
  borderRadius: 4,
  height: 24,
  padding: '0 8px',
};
const statusLightStyle = {
  alignItems: 'center',
  display: 'flex',
  height: 12,
  justifyContent: 'center',
  padding: '0 2px',
};
const statusDotStyle = {
  borderRadius: '50%',
  display: 'block',
  height: 8,
  transform: 'translateY(-1px)',
  width: 8,
};

const formatWithholdingRatePercent = (withholdingRateBps: number, locale?: string): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    withholdingRateBps / BASIS_POINTS_PER_PERCENT,
  );

const formatLastUpdatedTime = (lastUpdatedTime: Date, locale?: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lastUpdatedTime);

type StatusBadgeProps = {
  label: ReactNode;
  tone: 'standard' | 'emphasis' | 'warning' | 'alert' | 'success';
};

const StatusBadge: FunctionComponent<StatusBadgeProps> = ({ label, tone }) => (
  <div
    className='inline-flex items-center gap-xsmall shrink-0'
    style={statusBadgeStyle}
    aria-label={typeof label === 'string' ? label : undefined}>
    <span aria-hidden='true' className='shrink-0' style={statusLightStyle}>
      <span
        style={{
          ...statusDotStyle,
          backgroundColor: {
            emphasis: 'var(--color-system-emphasis)',
            standard: 'var(--color-content-default)',
            success: 'var(--color-system-success)',
            warning: 'var(--color-system-warning)',
            alert: 'var(--color-system-alert)',
          }[tone],
        }}
      />
    </span>
    <span className='text-body-small content-emphasis text-no-wrap block'>{label}</span>
  </div>
);

const TaxesPageContent: FunctionComponent<{
  statusVariant?: TaxDocumentationStatusVariant;
  lastUpdatedTime?: Date;
}> = ({ lastUpdatedTime, statusVariant = CURRENT_TAX_DOCUMENTATION_STATUS }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [isReplaceFormDialogOpen, setIsReplaceFormDialogOpen] = useState(false);
  const isApproved = statusVariant === 'approved';
  const isUnderReview = statusVariant === 'underReview';
  const isAdditionalInfoNeeded = statusVariant === 'additionalInfoNeeded';
  const isCuringRequired = statusVariant === 'curingRequired';
  const isFailed = statusVariant === 'failed';
  const isSubmitted =
    isApproved || isUnderReview || isAdditionalInfoNeeded || isCuringRequired || isFailed;
  const needsTaxFormAction = isAdditionalInfoNeeded || isCuringRequired || isFailed;
  const {
    data: withholdingRateData,
    isError: isWithholdingRateError,
    isLoading: isWithholdingRateLoading,
  } = useGetWithholdingRate();

  const taxInformationHeading = tPendingTranslation(
    'Tax information',
    'Heading for the tax information section on the DevEx taxes page.',
    translationKey('Heading.TaxInformation', TranslationNamespace.TaxDocumentation),
  );
  const bannerTitle = tPendingTranslation(
    'Action Required: Complete your tax information by October 31.',
    'Warning banner title prompting DevEx users to complete tax information by October 31.',
    translationKey('Taxes.Banner.TaxDocumentation.Title', TranslationNamespace.TaxDocumentation),
  );
  const approvedBannerTitle = tPendingTranslation(
    'Your tax information has been validated for payments beginning November 1, 2026.',
    'Success banner title shown when DevEx tax information has been validated.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.ApprovedTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const underReviewBannerTitle = tPendingTranslation(
    'Your tax information is under review.',
    'Information banner title shown when DevEx tax documentation is under review.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.UnderReviewTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const additionalInfoNeededBannerTitle = tPendingTranslation(
    'You have not submitted the required information to claim a reduced tax rate.',
    'Warning banner title shown when treaty information must be resubmitted to claim a reduced tax rate.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.AdditionalInfoRequiredTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const curingRequiredBannerTitle = tPendingTranslation(
    'Action Required: Submit additional documents to complete your tax information.',
    'Warning banner title shown when additional documents are needed.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.AdditionalInfoNeededTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const failedBannerTitle = tPendingTranslation(
    "Action Required: We couldn't validate your tax information.",
    'Error banner title shown when DevEx tax documentation verification fails.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.FailedTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const bannerDescription = tPendingTranslation(
    'Submit your tax information to ensure Roblox applies the correct U.S. withholding tax rate on DevEx payments processed on or after November 1. Otherwise, Roblox may be required to default to the U.S. backup withholding rate of 24% for all of your payments.',
    'Warning banner message explaining why DevEx users need to complete tax documentation.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.Description',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const additionalInfoNeededBannerDescription = tPendingTranslation(
    'Your tax form suggests you live in a country that has a tax treaty with the U.S. Tax treaties reduce U.S. tax withholding rates on payments.',
    'Warning banner message explaining why treaty information must be resubmitted to claim a reduced tax rate.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.AdditionalInfoRequiredDesc',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const curingRequiredBannerDescription = tPendingTranslation(
    'Submit the required information to ensure Roblox applies the correct U.S. withholding tax rate on DevEx payments.',
    'Warning banner message shown when additional tax documents are needed before November payouts',
    translationKey(
      'Taxes.Banner.TaxDocumentation.AddInfoNeededDesc',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const failedBannerDescription = tPendingTranslation(
    'Submit new tax information to ensure Roblox applies the correct U.S. withholding tax rate on DevEx payments.',
    'Error banner message shown when DevEx tax documentation verification fails.',
    translationKey(
      'Taxes.Banner.TaxDocumentation.FailedDescription',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const taxStatusTitle = tPendingTranslation(
    'Tax status',
    'Title for the tax status card.',
    translationKey('Taxes.Card.TaxStatus.Title', TranslationNamespace.TaxDocumentation),
  );
  const notStartedLabel = tPendingTranslation(
    'Not started',
    'Status label indicating tax documentation has not been started.',
    translationKey('Taxes.Status.NotStarted', TranslationNamespace.TaxDocumentation),
  );
  const approvedLabel = tPendingTranslation(
    'Validated',
    'Status label indicating tax information has been validated.',
    translationKey('Taxes.Status.Approved', TranslationNamespace.TaxDocumentation),
  );
  const underReviewLabel = tPendingTranslation(
    'Under review',
    'Status label indicating tax documentation is under review.',
    translationKey('Taxes.Status.UnderReview', TranslationNamespace.TaxDocumentation),
  );
  const additionalInfoNeededLabel = tPendingTranslation(
    'Additional info needed',
    'Status label indicating more tax documentation information is needed.',
    translationKey('Taxes.Status.AdditionalInfoNeeded', TranslationNamespace.TaxDocumentation),
  );
  const failedLabel = tPendingTranslation(
    'Failed',
    'Status label indicating tax documentation verification failed.',
    translationKey('Taxes.Status.Failed', TranslationNamespace.TaxDocumentation),
  );
  const lastUpdatedLabel =
    lastUpdatedTime === undefined
      ? undefined
      : tPendingTranslation(
          'Last update: {lastUpdatedTime}',
          'Localized date and time when the tax documentation status last changed.',
          translationKey('Taxes.Card.TaxStatus.LastUpdated', TranslationNamespace.TaxDocumentation),
          { lastUpdatedTime: formatLastUpdatedTime(lastUpdatedTime, locale ?? undefined) },
        );
  const getStartedLabel = tPendingTranslation(
    'Get started',
    'Primary action button label for starting tax documentation.',
    translationKey('Taxes.Action.GetStarted', TranslationNamespace.TaxDocumentation),
  );
  const continueLabel = tPendingTranslation(
    'Continue',
    'Primary action button label for continuing tax documentation.',
    translationKey('Taxes.Action.Continue', TranslationNamespace.TaxDocumentation),
  );
  const resubmitLabel = tPendingTranslation(
    'Resubmit',
    'Primary action button label for resubmitting tax treaty information.',
    translationKey('Taxes.Action.Resubmit', TranslationNamespace.TaxDocumentation),
  );
  const newTaxFormLabel = tPendingTranslation(
    'New tax form',
    'Primary action button label for submitting a new tax form after failure.',
    translationKey('Taxes.Action.NewTaxForm', TranslationNamespace.TaxDocumentation),
  );
  const withholdingRateTitle = tPendingTranslation(
    'U.S. tax withholding rate (Effective November 1st)',
    'Title for the tax withholding rate section.',
    translationKey('Taxes.Card.WithholdingRate.Title', TranslationNamespace.TaxDocumentation),
  );
  const learnAboutRatesLabel = tPendingTranslation(
    'Learn about rates',
    'Link label for learning about DevEx tax withholding rates.',
    translationKey('Taxes.Action.LearnAboutRates', TranslationNamespace.TaxDocumentation),
  );
  const withholdingRate = tPendingTranslation(
    '24% of all earnings',
    'Tax withholding rate shown when default backup withholding applies.',
    translationKey('Taxes.Card.WithholdingRate.Value', TranslationNamespace.TaxDocumentation),
  );
  const loadingWithholdingRate = tPendingTranslation(
    'Loading rate',
    'Placeholder shown while withholding rate is loading.',
    translationKey(
      'Taxes.Card.WithholdingRate.LoadingValue',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const unavailableWithholdingRate = tPendingTranslation(
    'Rate unavailable',
    'Placeholder shown when withholding rate cannot be loaded.',
    translationKey(
      'Taxes.Card.WithholdingRate.UnavailableValue',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const determinedUsSourceWithholdingRate =
    withholdingRateData?.rate?.withholdingRateBps !== undefined
      ? tPendingTranslation(
          '{rate}% of U.S. source income',
          'Tax withholding rate applied on U.S. source income; {rate} is a percentage.',
          translationKey(
            'Taxes.Card.WithholdingRate.DeterminedValue',
            TranslationNamespace.TaxDocumentation,
          ),
          {
            rate: formatWithholdingRatePercent(
              withholdingRateData.rate.withholdingRateBps,
              locale ?? undefined,
            ),
          },
        )
      : undefined;
  const determinedAllEarningsWithholdingRate =
    withholdingRateData?.rate?.withholdingRateBps !== undefined
      ? tPendingTranslation(
          '{rate}% of all earnings',
          'Tax withholding rate applied on all earnings; {rate} is a percentage.',
          translationKey(
            'Taxes.Card.WithholdingRate.DeterminedAllEarningsValue',
            TranslationNamespace.TaxDocumentation,
          ),
          {
            rate: formatWithholdingRatePercent(
              withholdingRateData.rate.withholdingRateBps,
              locale ?? undefined,
            ),
          },
        )
      : undefined;
  let determinedWithholdingRate: ReactNode;
  switch (withholdingRateData?.rate?.basis) {
    case WithholdingBasis.AllEarnings:
      determinedWithholdingRate = determinedAllEarningsWithholdingRate;
      break;
    case WithholdingBasis.UsSource:
      determinedWithholdingRate = determinedUsSourceWithholdingRate;
      break;
    case WithholdingBasis.Invalid:
    case undefined:
      determinedWithholdingRate = undefined;
      break;
  }
  const withholdingRateDescription = tPendingTranslation(
    'Submit your tax information to apply the correct U.S. withholding tax rate.',
    'Description explaining the default tax withholding rate before documentation is submitted.',
    translationKey('Taxes.Card.WithholdingRate.Description', TranslationNamespace.TaxDocumentation),
  );
  const failedWithholdingRateDescription = tPendingTranslation(
    'Submit your tax information to apply the correct U.S. withholding tax rate.',
    'Description explaining backup tax withholding rate after verification fails.',
    translationKey(
      'Taxes.Card.WithholdingRate.FailedDescription',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const approvedWithholdingRateDescription = tPendingTranslation(
    'This withholding rate is based on your current tax information.',
    'Description explaining the approved tax withholding rate.',
    translationKey(
      'Taxes.Card.WithholdingRate.ApprovedDescription',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const informationChangedLabel = tPendingTranslation(
    'Information changed?',
    'Prompt shown when approved tax information may need updating.',
    translationKey('Taxes.Description.InformationChanged', TranslationNamespace.TaxDocumentation),
  );
  const submitNewTaxFormLabel = tPendingTranslation(
    'Submit new tax form',
    'Link label for submitting a new tax form after information changes.',
    translationKey('Taxes.Action.SubmitNewTaxForm', TranslationNamespace.TaxDocumentation),
  );
  const replaceFormTitle = tPendingTranslation(
    'Replace current form?',
    'Title for the confirmation modal shown before replacing current tax information.',
    translationKey('Taxes.Heading.ReplaceCurrentForm', TranslationNamespace.TaxDocumentation),
  );
  const replaceFormBody = tPendingTranslation(
    'Your current tax form and withholding rate will be invalidated once new tax information is submitted. Please note that the review process may take several days.',
    'Body for the confirmation modal explaining the effects of replacing current tax information.',
    translationKey('Taxes.Description.ReplaceCurrentForm', TranslationNamespace.TaxDocumentation),
  );
  const cancelLabel = tPendingTranslation(
    'Cancel',
    'Button label for cancelling replacement of the current tax form.',
    translationKey('Taxes.Action.CancelReplaceCurrentForm', TranslationNamespace.TaxDocumentation),
  );
  const closeReplaceFormDialogLabel = tPendingTranslation(
    'Close',
    'Accessibility label for closing the replace-current-form confirmation modal.',
    translationKey('Taxes.Action.CloseReplaceCurrentForm', TranslationNamespace.TaxDocumentation),
  );
  const documentsHeading = tPendingTranslation(
    'Documents',
    'Heading for historic tax documents section.',
    translationKey('Taxes.Heading.Documents', TranslationNamespace.TaxDocumentation),
  );
  const documentsDescription = tPendingTranslation(
    'Looking for your historic tax documents? Request a document download from DevEx Support.',
    'Description explaining how DevEx users can request historic tax documents.',
    translationKey('Taxes.Description.Documents', TranslationNamespace.TaxDocumentation),
  );
  const contactSupportLabel = tPendingTranslation(
    'Contact support',
    'Button label for contacting support.',
    translationKey('Taxes.Action.ContactSupport', TranslationNamespace.TaxDocumentation),
  );
  // The withholding value is driven by the tax service's withholding-rate result:
  // a DeterminedRate applies on U.S. source income; a NotDeterminable (any reason)
  // means 24% backup withholding on all earnings.
  const liveWithholdingRate = isWithholdingRateLoading
    ? loadingWithholdingRate
    : isWithholdingRateError
      ? unavailableWithholdingRate
      : withholdingRateData?.rate
        ? (determinedWithholdingRate ?? unavailableWithholdingRate)
        : withholdingRate;
  const openReplaceFormDialog = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsReplaceFormDialogOpen(true);
  }, []);
  const closeReplaceFormDialog = useCallback(() => {
    setIsReplaceFormDialogOpen(false);
  }, []);
  const handleReplaceFormDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsReplaceFormDialogOpen(isOpen);
  }, []);
  const taxStatus = mapTaxDocumentationStatusToTelemetryStatus(statusVariant);
  const handleTaxStatusCardClick = useCallback(() => {
    let action: TaxEntryAction = 'start';
    if (isFailed) {
      action = 'new_form';
    } else if (isAdditionalInfoNeeded || isCuringRequired) {
      action = 'continue';
    }

    logTaxHubEntryClick(unifiedLogger, {
      entryPoint: 'tax_status_card',
      action,
      taxStatus,
    });
  }, [isAdditionalInfoNeeded, isCuringRequired, isFailed, taxStatus, unifiedLogger]);
  const handleReplaceFormClick = useCallback(() => {
    logTaxHubEntryClick(unifiedLogger, {
      entryPoint: 'replace_form_dialog',
      action: 'replace_form',
      taxStatus,
    });
  }, [taxStatus, unifiedLogger]);

  return (
    <div className='flex flex-col gap-xlarge' style={{ maxWidth: 628 }}>
      <section className='flex flex-col gap-large'>
        <h2 className='text-heading-small content-default margin-none'>{taxInformationHeading}</h2>
        <FeedbackBanner
          severity={
            isApproved ? 'Success' : isUnderReview ? 'Info' : isFailed ? 'Error' : 'Warning'
          }
          variant='Emphasis'
          layout='Stacked'
          title={
            isApproved
              ? approvedBannerTitle
              : isUnderReview
                ? underReviewBannerTitle
                : isAdditionalInfoNeeded
                  ? additionalInfoNeededBannerTitle
                  : isCuringRequired
                    ? curingRequiredBannerTitle
                    : isFailed
                      ? failedBannerTitle
                      : bannerTitle
          }
          description={
            isApproved || isUnderReview ? undefined : (
              <span className='block' style={{ maxWidth: 440 }}>
                {isAdditionalInfoNeeded
                  ? additionalInfoNeededBannerDescription
                  : isCuringRequired
                    ? curingRequiredBannerDescription
                    : isFailed
                      ? failedBannerDescription
                      : bannerDescription}
              </span>
            )
          }
        />
        <div
          className='flex flex-col gap-large bg-shift-100 radius-medium'
          style={{ padding: isFailed ? 16 : 20 }}>
          {isSubmitted ? (
            <div className='flex flex-col gap-large'>
              <div className='flex items-start justify-between gap-medium'>
                <div className='flex flex-col gap-xsmall'>
                  <h3 className='text-title-medium content-default margin-none'>
                    {taxStatusTitle}
                  </h3>
                  {lastUpdatedLabel !== undefined && (
                    <p className='text-body-medium content-default margin-none'>
                      {lastUpdatedLabel}
                    </p>
                  )}
                </div>
                <StatusBadge
                  label={
                    isApproved
                      ? approvedLabel
                      : isUnderReview
                        ? underReviewLabel
                        : isAdditionalInfoNeeded
                          ? approvedLabel
                          : isCuringRequired
                            ? additionalInfoNeededLabel
                            : failedLabel
                  }
                  tone={
                    isApproved
                      ? 'success'
                      : isUnderReview
                        ? 'emphasis'
                        : isAdditionalInfoNeeded
                          ? 'success'
                          : isCuringRequired
                            ? 'warning'
                            : 'alert'
                  }
                />
              </div>
              {needsTaxFormAction && (
                <div>
                  <Button
                    as='a'
                    href={isFailed ? NEW_TAX_FORM_ROUTE : TAX_SUBMISSION_ROUTE}
                    variant='Emphasis'
                    size='Medium'
                    style={fitContentButtonStyle}
                    onClick={handleTaxStatusCardClick}>
                    {isFailed
                      ? newTaxFormLabel
                      : isAdditionalInfoNeeded
                        ? resubmitLabel
                        : continueLabel}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-large'>
              <div className='flex items-center justify-between gap-medium'>
                <h3 className='text-title-medium content-default margin-none'>{taxStatusTitle}</h3>
                <StatusBadge label={notStartedLabel} tone='standard' />
              </div>
              <div>
                <Button
                  as='a'
                  href={TAX_SUBMISSION_ROUTE}
                  variant='Emphasis'
                  size='Medium'
                  style={fitContentButtonStyle}
                  onClick={handleTaxStatusCardClick}>
                  {getStartedLabel}
                </Button>
              </div>
            </div>
          )}
          <Divider />
          <div className='flex flex-col gap-medium'>
            <div className='flex wrap items-center justify-between gap-medium'>
              <h3 className='text-title-medium content-default margin-none'>
                {withholdingRateTitle}
              </h3>
              <Link href={DEVEX_TAX_HELP_URL} target='_blank' size='Medium'>
                {learnAboutRatesLabel}
              </Link>
            </div>
            <div className='flex flex-col gap-xsmall'>
              <div className='text-heading-small content-emphasis'>{liveWithholdingRate}</div>
              <div className='flex items-start gap-small content-default'>
                <Icon
                  name='icon-regular-circle-i'
                  size='Small'
                  className='shrink-0'
                  style={{ marginTop: 1 }}
                />
                <p className='text-body-small margin-none'>
                  {isApproved || isUnderReview || isAdditionalInfoNeeded || isCuringRequired
                    ? approvedWithholdingRateDescription
                    : isFailed
                      ? failedWithholdingRateDescription
                      : withholdingRateDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
        {isSubmitted && !isFailed && (
          <p className='text-body-medium content-default margin-none'>
            {informationChangedLabel}{' '}
            <Link href={NEW_TAX_FORM_ROUTE} size='Medium' onClick={openReplaceFormDialog}>
              {submitNewTaxFormLabel}
            </Link>
          </p>
        )}
      </section>
      <section className='flex flex-col gap-large'>
        <h2 className='text-heading-small content-default margin-none'>{documentsHeading}</h2>
        <div className='flex flex-col gap-medium'>
          <p className='text-body-medium content-default margin-none'>{documentsDescription}</p>
          <div>
            <Button
              as='a'
              href={TAX_SUPPORT_URL}
              target='_blank'
              rel='noreferrer'
              variant='Standard'
              size='Medium'
              style={fitContentButtonStyle}>
              {contactSupportLabel}
            </Button>
          </div>
        </div>
      </section>
      <Dialog
        open={isReplaceFormDialogOpen}
        onOpenChange={handleReplaceFormDialogOpenChange}
        size='Small'
        isModal
        hasCloseAffordance
        closeLabel={closeReplaceFormDialogLabel}>
        <DialogContent>
          <DialogBody className='flex flex-col gap-xsmall'>
            <DialogTitle className='text-heading-small content-emphasis margin-none'>
              {replaceFormTitle}
            </DialogTitle>
            <p className='text-body-medium content-default margin-none'>{replaceFormBody}</p>
          </DialogBody>
          <DialogFooter className='flex gap-xsmall padding-top-large'>
            <Button
              as='a'
              href={NEW_TAX_FORM_ROUTE}
              variant='Emphasis'
              size='Medium'
              className='fill basis-0'
              onClick={handleReplaceFormClick}>
              {continueLabel}
            </Button>
            <Button
              variant='Standard'
              size='Medium'
              className='fill basis-0'
              onClick={closeReplaceFormDialog}>
              {cancelLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxesPageContent;

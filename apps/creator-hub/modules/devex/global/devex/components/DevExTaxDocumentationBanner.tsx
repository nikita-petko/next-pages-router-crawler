import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEVEX_TAX_HELP_URL } from '../../constants/externalLinkConstants';
import type { TaxDocumentationStatusVariant } from '../../taxes/utils/taxDocumentationStatus';
import {
  logDevExTaxHubEntryClick,
  mapTaxDocumentationStatusToTelemetryStatus,
} from '../../taxes/utils/taxTelemetry';

const TAX_SUBMISSION_ROUTE = '/dashboard/devex/taxes/taxsubmission';
const TAXES_ROUTE = '/dashboard/devex/taxes';

type DevExTaxDocumentationBannerProps = {
  statusVariant?: TaxDocumentationStatusVariant;
};

const DevExTaxDocumentationBanner: FunctionComponent<DevExTaxDocumentationBannerProps> = ({
  statusVariant = 'notStarted',
}) => {
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const isCuringRequired = statusVariant === 'curingRequired';
  const isFailed = statusVariant === 'failed';
  const taxStatus = mapTaxDocumentationStatusToTelemetryStatus(statusVariant);
  const logStartClick = useCallback(() => {
    logDevExTaxHubEntryClick(unifiedLogger, { action: 'start', taxStatus });
  }, [taxStatus, unifiedLogger]);
  const logViewClick = useCallback(() => {
    logDevExTaxHubEntryClick(unifiedLogger, { action: 'view', taxStatus });
  }, [taxStatus, unifiedLogger]);

  const title = tPendingTranslation(
    'Action Required: Complete your tax information by October to reduce withholding.',
    'Warning banner title prompting DevEx users to complete tax information by October to reduce withholding.',
    translationKey('Banner.TaxDocumentation.Title', TranslationNamespace.TaxDocumentation),
  );
  const description = tPendingTranslation(
    'Starting November 1st, Roblox will be required by the IRS to withhold US taxes from payments to creators. Complete your tax documentation in the Creator Hub to reduce withholding rates.',
    'Warning banner message explaining why DevEx users need to complete tax documentation to reduce withholding rates.',
    translationKey('Banner.TaxDocumentation.Description', TranslationNamespace.TaxDocumentation),
  );
  const additionalInfoNeededTitle = tPendingTranslation(
    'Action Required: Submit additional documents to complete your tax information.',
    'Warning banner title prompting DevEx users to submit additional tax documents.',
    translationKey(
      'Banner.TaxDocumentation.AdditionalInfoNeededTitle',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const additionalInfoNeededDescription = tPendingTranslation(
    'Submit the required information to ensure Roblox applies the correct U.S. withholding tax rate on DevEx payments.',
    'Warning banner message prompting DevEx users to submit required tax information for the correct withholding rate.',
    translationKey(
      'Banner.TaxDocumentation.AdditionalInfoNeededDescription',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const failedTitle = tPendingTranslation(
    "Action Required: We couldn't validate your tax information.",
    'Error banner title shown when DevEx tax information validation fails.',
    translationKey('Banner.TaxDocumentation.FailedTitle', TranslationNamespace.TaxDocumentation),
  );
  const failedDescription = tPendingTranslation(
    'Submit new tax information to ensure Roblox applies the correct U.S. withholding tax rate on DevEx payments.',
    'Error banner message prompting DevEx users to submit new tax information for the correct withholding rate.',
    translationKey(
      'Banner.TaxDocumentation.FailedDescription',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const getStartedLabel = tPendingTranslation(
    'Get started',
    'Primary action button label for starting DevEx tax documentation.',
    translationKey('Action.TaxDocumentation.GetStarted', TranslationNamespace.TaxDocumentation),
  );
  const learnMoreLabel = tPendingTranslation(
    'Learn more',
    'Tertiary action button label for learning more about DevEx tax documentation.',
    translationKey('Action.TaxDocumentation.LearnMore', TranslationNamespace.TaxDocumentation),
  );
  const viewTaxesLabel = tPendingTranslation(
    'View Taxes',
    'Primary action button label for viewing DevEx tax status.',
    translationKey('Action.TaxDocumentation.ViewTaxesV2', TranslationNamespace.TaxDocumentation),
  );

  if (!ready) {
    return null;
  }

  const resolvedTitle = isFailed
    ? failedTitle
    : isCuringRequired
      ? additionalInfoNeededTitle
      : title;
  const resolvedDescription = isFailed
    ? failedDescription
    : isCuringRequired
      ? additionalInfoNeededDescription
      : description;

  return (
    <FeedbackBanner
      severity={isFailed ? 'Error' : 'Warning'}
      variant='Emphasis'
      layout='Stacked'
      title={resolvedTitle}
      description={
        <span className='block' style={{ maxWidth: 440 }}>
          {resolvedDescription}
        </span>
      }
      actions={
        <div className='flex wrap items-center gap-small'>
          {!(isCuringRequired || isFailed) && (
            <Button
              as='a'
              href={TAX_SUBMISSION_ROUTE}
              variant='SoftEmphasis'
              size='Small'
              onClick={logStartClick}>
              {getStartedLabel}
            </Button>
          )}
          <Button as='a' href={TAXES_ROUTE} variant='Standard' size='Small' onClick={logViewClick}>
            {viewTaxesLabel}
          </Button>
          <Button
            as='a'
            href={DEVEX_TAX_HELP_URL}
            target='_blank'
            rel='noreferrer'
            variant='Utility'
            size='Small'>
            {learnMoreLabel}
          </Button>
        </div>
      }
    />
  );
};

export default DevExTaxDocumentationBanner;

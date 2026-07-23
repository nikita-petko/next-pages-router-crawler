import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Icon,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  PaymentType,
  TaxOnboardingStatus,
  TaxOnboardingTokenBlockedReason,
} from '@modules/clients/creatorTaxApi';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TaxesErrorState from '../../taxes/components/TaxesErrorState';
import TaxesLoading from '../../taxes/components/TaxesLoading';
import TaxesPageStateLayout from '../../taxes/components/TaxesPageStateLayout';
import {
  getTaxOnboardingStatusQueryKey,
  useGetTaxOnboardingStatus,
} from '../../taxes/queries/useGetTaxOnboardingStatus';
import { getWithholdingRateQueryKey } from '../../taxes/queries/useGetWithholdingRate';
import { resolveTaxDocumentationStatusVariant } from '../../taxes/utils/taxDocumentationStatus';
import {
  logTaxHubErrorOut,
  logTaxHubFlowCompleted,
  logTaxHubFlowDuration,
  logTaxHubFlowStarted,
  logTaxHubFlowStepViewed,
  mapTaxDocumentationStatusToTelemetryStatus,
  type TaxFlowStartReason,
  type TaxFlowOutcome,
  type TaxFlowStep,
  type TaxFlowType,
  type TaxStepDirection,
  type TaxTelemetryStatus,
} from '../../taxes/utils/taxTelemetry';
import { useGetOrCreateTaxOnboarding } from '../queries/useGetOrCreateTaxOnboarding';
import { resolveTaxbitSubmissionMode } from '../utils/taxbitSubmissionMode';
import type { TaxbitCuringDocumentationProps } from './TaxbitCuringDocumentation';
import type { TaxbitTaxSubmissionQuestionnaireProps } from './TaxbitTaxSubmissionQuestionnaire';

const TAXES_ROUTE = '/dashboard/devex/taxes';
const TAX_SUPPORT_URL = `https://${process.env.robloxSiteDomain}/support`;

const getLoadingTaxFormLabel = (tPendingTranslation: TPendingTranslationFunction) =>
  tPendingTranslation(
    'Loading your tax form...',
    'Loading message shown while the Taxbit SDK form is loading.',
    translationKey('Taxes.Description.LoadingTaxForm', TranslationNamespace.TaxDocumentation),
  );

const TaxbitSdkLoading: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return <TaxesLoading context='taxbit' label={getLoadingTaxFormLabel(tPendingTranslation)} />;
};

const TaxbitTaxSubmissionQuestionnaire = dynamic<TaxbitTaxSubmissionQuestionnaireProps>(
  () => import('./TaxbitTaxSubmissionQuestionnaire'),
  {
    ssr: false,
    loading: () => <TaxbitSdkLoading />,
  },
);

const TaxbitCuringDocumentation = dynamic<TaxbitCuringDocumentationProps>(
  () => import('./TaxbitCuringDocumentation'),
  {
    ssr: false,
    loading: () => <TaxbitSdkLoading />,
  },
);

type TaxbitTaxSubmissionAccountChangedDialogProps = {
  title: string;
  body: string;
  contactSupportLabel: string;
  closeLabel: string;
  onClose: () => void;
};

const TaxbitTaxSubmissionAccountChangedDialog: FunctionComponent<
  TaxbitTaxSubmissionAccountChangedDialogProps
> = ({ title, body, contactSupportLabel, closeLabel, onClose }) => {
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog
      open
      onOpenChange={handleOpenChange}
      size='Small'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-xsmall'>
          <DialogTitle className='text-heading-small content-emphasis margin-none'>
            {title}
          </DialogTitle>
          <p className='text-body-medium content-default margin-none'>{body}</p>
        </DialogBody>
        <DialogFooter className='padding-top-large'>
          <Button
            as='a'
            href={TAX_SUPPORT_URL}
            target='_blank'
            rel='noreferrer'
            variant='Standard'
            size='Medium'
            style={{ width: '100%' }}>
            {contactSupportLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type TaxbitTaxSubmissionSessionExpiredDialogProps = {
  title: string;
  body: string;
  okLabel: string;
  onConfirm: () => void;
};

const TaxbitTaxSubmissionSessionExpiredDialog: FunctionComponent<
  TaxbitTaxSubmissionSessionExpiredDialogProps
> = ({ title, body, okLabel, onConfirm }) => (
  <Dialog open size='Small' isModal hasCloseAffordance={false}>
    <DialogContent>
      <DialogBody className='flex flex-col gap-xsmall'>
        <DialogTitle className='text-heading-small content-emphasis margin-none'>
          {title}
        </DialogTitle>
        <p className='text-body-medium content-default margin-none'>{body}</p>
      </DialogBody>
      <DialogFooter className='padding-top-large'>
        <Button variant='Standard' size='Medium' className='width-full' onClick={onConfirm}>
          {okLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

type TaxbitTaxSubmissionCompleteScreenProps = {
  title: string;
  body: string;
  doneLabel: string;
  onDone: () => void;
};

const TaxbitTaxSubmissionCompleteScreen: FunctionComponent<
  TaxbitTaxSubmissionCompleteScreenProps
> = ({ title, body, doneLabel, onDone }) => (
  <TaxesPageStateLayout context='taxbit'>
    <Icon
      name='icon-regular-circle-check'
      className='content-emphasis'
      size='XLarge'
      style={{ height: 44, width: 44 }}
    />
    <div className='flex flex-col items-center width-full gap-small'>
      <h2 className='text-heading-medium content-emphasis text-align-x-center margin-none'>
        {title}
      </h2>
      <p className='text-body-large content-emphasis text-align-x-center margin-none width-full'>
        {body}
      </p>
    </div>
    <Button variant='Emphasis' size='Large' onClick={onDone} style={{ width: 178 }}>
      {doneLabel}
    </Button>
  </TaxesPageStateLayout>
);

const TaxbitTaxSubmissionPageTitleContent: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const taxesLabel = tPendingTranslation(
    'Taxes',
    'Page title / navigation label for the DevEx taxes page.',
    translationKey('Heading.Taxes', TranslationNamespace.TaxDocumentation),
  );
  const taxDocumentationLabel = tPendingTranslation(
    'Tax documentation',
    'Breadcrumb label for the Taxbit tax documentation flow.',
    translationKey('Heading.TaxDocumentation', TranslationNamespace.TaxDocumentation),
  );

  return (
    <nav
      aria-label={taxDocumentationLabel}
      className='flex items-center gap-small'
      data-taxbit-tax-submission-breadcrumb>
      <Link
        href={TAXES_ROUTE}
        className='text-body-medium content-default'
        style={{ textDecoration: 'none' }}>
        {taxesLabel}
      </Link>
      <span className='text-body-medium content-default' aria-hidden='true'>
        /
      </span>
      <span className='text-title-medium content-emphasis'>{taxDocumentationLabel}</span>
    </nav>
  );
};

export const TaxbitTaxSubmissionPageTitle = withTranslation(TaxbitTaxSubmissionPageTitleContent, [
  TranslationNamespace.TaxDocumentation,
]);

const TaxbitTaxSubmissionPage: FunctionComponent = () => {
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [completedSubmission, setCompletedSubmission] = useState<'curing' | 'taxForm' | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [hasTaxbitLoadError, setHasTaxbitLoadError] = useState(false);
  const flowStartedAtMs = useRef<number | undefined>(undefined);
  const hasLoggedFlowDuration = useRef(false);
  const hasLoggedFlowStarted = useRef(false);
  const hasLoggedSessionExpired = useRef(false);
  const hasLoggedRedirectError = useRef(false);
  const hasLoggedAccountChanged = useRef(false);
  const {
    data: taxOnboarding,
    isError: isTaxOnboardingError,
    isFetching: isTaxOnboardingFetching,
    isLoading: isTaxOnboardingLoading,
    refetch: refetchTaxOnboarding,
  } = useGetOrCreateTaxOnboarding({ enabled: ready });
  const {
    data: taxOnboardingStatus,
    isError: isTaxOnboardingStatusError,
    isFetching: isTaxOnboardingStatusFetching,
    isLoading: isTaxOnboardingStatusLoading,
  } = useGetTaxOnboardingStatus({ enabled: ready });
  const sdkToken = taxOnboarding?.sdkToken;
  const tokenExpiryTime = taxOnboarding?.tokenExpiryTime;
  const forceNewForm = router.query.forceNewForm === '1';
  const submissionMode = resolveTaxbitSubmissionMode(
    taxOnboardingStatus?.onboardingStatus,
    forceNewForm,
  );
  const isPasswordChangedBlocked =
    taxOnboarding?.tokenBlockedReason === TaxOnboardingTokenBlockedReason.PasswordChangedRecently;
  const isTaxOnboardingSettled = ready && !isTaxOnboardingLoading && !isTaxOnboardingFetching;
  const isTaxOnboardingStatusSettled =
    ready && !isTaxOnboardingStatusLoading && !isTaxOnboardingStatusFetching;
  const isPageLoading =
    !ready ||
    !router.isReady ||
    isTaxOnboardingLoading ||
    isTaxOnboardingFetching ||
    isTaxOnboardingStatusLoading ||
    isTaxOnboardingStatusFetching;
  // When 2SV/auth or status loading fails, is cancelled, or no SDK token can be minted, send the
  // creator back to the taxes center. The recent-password-change case shows its own modal instead.
  const shouldRedirectToTaxes =
    (isTaxOnboardingSettled && !isPasswordChangedBlocked && (isTaxOnboardingError || !sdkToken)) ||
    (isTaxOnboardingStatusSettled && !isPasswordChangedBlocked && isTaxOnboardingStatusError);
  const flowType: TaxFlowType = submissionMode === 'curing' ? 'curing' : 'tax_form';
  const errorFlowType: TaxFlowType | 'unknown' =
    taxOnboardingStatus?.onboardingStatus === undefined ? 'unknown' : flowType;
  const taxStatus = mapTaxDocumentationStatusToTelemetryStatus(
    resolveTaxDocumentationStatusVariant(taxOnboardingStatus?.onboardingStatus),
  );
  const durationContext = useRef<{ flowType: TaxFlowType; taxStatus: TaxTelemetryStatus }>({
    flowType,
    taxStatus,
  });
  let startReason: TaxFlowStartReason = 'resume';
  if (submissionMode === 'curing') {
    startReason = 'curing';
  } else if (forceNewForm) {
    startReason = 'replace';
  } else if (
    taxOnboardingStatus?.onboardingStatus === TaxOnboardingStatus.NotStarted ||
    taxOnboardingStatus?.onboardingStatus === TaxOnboardingStatus.Invalid
  ) {
    startReason = 'new';
  }

  useEffect(() => {
    durationContext.current = { flowType, taxStatus };
  }, [flowType, taxStatus]);

  const logFlowDuration = useCallback(
    (outcome: TaxFlowOutcome) => {
      if (flowStartedAtMs.current === undefined || hasLoggedFlowDuration.current) {
        return;
      }

      hasLoggedFlowDuration.current = true;
      logTaxHubFlowDuration(unifiedLogger, {
        ...durationContext.current,
        durationMs: Date.now() - flowStartedAtMs.current,
        outcome,
      });
    },
    [unifiedLogger],
  );
  const logSessionExpired = useCallback(() => {
    if (hasLoggedSessionExpired.current) {
      return;
    }

    hasLoggedSessionExpired.current = true;
    logTaxHubErrorOut(unifiedLogger, 'session_expired', flowType);
  }, [flowType, unifiedLogger]);

  const handleTaxbitError = useCallback(() => {
    logFlowDuration('error');
    if (tokenExpiryTime && tokenExpiryTime.getTime() <= Date.now()) {
      logSessionExpired();
      setIsSessionExpired(true);
      return;
    }

    logTaxHubErrorOut(unifiedLogger, 'tax_form_load', flowType, true);
    setHasTaxbitLoadError(true);
  }, [flowType, logFlowDuration, logSessionExpired, tokenExpiryTime, unifiedLogger]);
  const retryTaxbitLoad = useCallback(() => {
    flowStartedAtMs.current = undefined;
    hasLoggedFlowDuration.current = false;
    hasLoggedFlowStarted.current = false;
    hasLoggedSessionExpired.current = false;
    setHasTaxbitLoadError(false);
    void refetchTaxOnboarding();
  }, [refetchTaxOnboarding]);
  const closeAccountChangedDialog = useCallback(() => {
    void router.push(TAXES_ROUTE);
  }, [router]);
  const handleFlowReady = useCallback(() => {
    if (hasLoggedFlowStarted.current) {
      return;
    }

    hasLoggedFlowStarted.current = true;
    flowStartedAtMs.current = Date.now();
    hasLoggedFlowDuration.current = false;
    logTaxHubFlowStarted(unifiedLogger, { flowType, startReason, taxStatus });
  }, [flowType, startReason, taxStatus, unifiedLogger]);
  const handleStepViewed = useCallback(
    (step: TaxFlowStep, direction: TaxStepDirection) => {
      logTaxHubFlowStepViewed(unifiedLogger, { step, direction, taxStatus });
    },
    [taxStatus, unifiedLogger],
  );
  const handleTaxFormSubmissionComplete = useCallback(() => {
    logTaxHubFlowCompleted(unifiedLogger, { flowType: 'tax_form', taxStatus });
    logFlowDuration('completed');
    setCompletedSubmission('taxForm');
  }, [logFlowDuration, taxStatus, unifiedLogger]);
  const handleCuringSubmissionComplete = useCallback(() => {
    logTaxHubFlowCompleted(unifiedLogger, { flowType: 'curing', taxStatus });
    logFlowDuration('completed');
    setCompletedSubmission('curing');
  }, [logFlowDuration, taxStatus, unifiedLogger]);
  const handleCompletionDone = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: getTaxOnboardingStatusQueryKey() });
    void queryClient.invalidateQueries({
      queryKey: getWithholdingRateQueryKey(PaymentType.Royalty),
    });
    void router.push(TAXES_ROUTE);
  }, [queryClient, router]);
  const handleSessionExpiredConfirm = useCallback(() => {
    void router.push(TAXES_ROUTE);
  }, [router]);

  useEffect(() => {
    flowStartedAtMs.current = undefined;
    hasLoggedFlowDuration.current = false;
    hasLoggedFlowStarted.current = false;
    hasLoggedSessionExpired.current = false;
  }, [sdkToken]);

  useEffect(() => {
    const handlePageHide = () => logFlowDuration('exited');
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      logFlowDuration('exited');
    };
  }, [logFlowDuration]);

  useEffect(() => {
    if (!shouldRedirectToTaxes || hasLoggedRedirectError.current) {
      return;
    }

    hasLoggedRedirectError.current = true;
    logTaxHubErrorOut(
      unifiedLogger,
      isTaxOnboardingStatusError ? 'submission_status_load' : 'onboarding_unavailable',
      errorFlowType,
    );
    void router.push(TAXES_ROUTE);
  }, [errorFlowType, isTaxOnboardingStatusError, router, shouldRedirectToTaxes, unifiedLogger]);

  useEffect(() => {
    if (isPageLoading || !isPasswordChangedBlocked || hasLoggedAccountChanged.current) {
      return;
    }

    hasLoggedAccountChanged.current = true;
    logTaxHubErrorOut(unifiedLogger, 'account_changed', errorFlowType);
  }, [errorFlowType, isPageLoading, isPasswordChangedBlocked, unifiedLogger]);

  useEffect(() => {
    if (!sdkToken || !tokenExpiryTime || completedSubmission !== null) {
      return undefined;
    }

    const timeoutId = setTimeout(
      () => {
        logFlowDuration('error');
        logSessionExpired();
        setIsSessionExpired(true);
      },
      Math.max(tokenExpiryTime.getTime() - Date.now(), 0),
    );
    return () => clearTimeout(timeoutId);
  }, [completedSubmission, logFlowDuration, logSessionExpired, sdkToken, tokenExpiryTime]);

  const loadingTaxFormLabel = getLoadingTaxFormLabel(tPendingTranslation);
  const taxbitLoadErrorMessage = tPendingTranslation(
    "We're having trouble loading the tax form. Please check your internet connection or try again later.",
    'Error shown when the Taxbit tax form or curing flow cannot load.',
    translationKey('Taxes.Error.LoadTaxForm', TranslationNamespace.TaxDocumentation),
  );
  const tryAgainLabel = tPendingTranslation(
    'Try again',
    'Button label for retrying a failed DevEx tax request.',
    translationKey('Taxes.Action.TryAgain', TranslationNamespace.TaxDocumentation),
  );
  const accountInformationChangedTitle = tPendingTranslation(
    'Account information changed',
    'Title for modal shown when recent account changes block Taxbit tax form access.',
    translationKey(
      'Taxes.Heading.AccountInformationChanged',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const accountInformationChangedBody = tPendingTranslation(
    'You recently made changes to this account, contact support for more information.',
    'Body for modal shown when recent account changes block Taxbit tax form access.',
    translationKey(
      'Taxes.Description.AccountInformationChanged',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const contactSupportLabel = tPendingTranslation(
    'Contact support',
    'Button label for contacting support.',
    translationKey('Taxes.Action.ContactSupport', TranslationNamespace.TaxDocumentation),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Accessibility label for closing the account-changed modal / Help Center.',
    translationKey('Action.Close', TranslationNamespace.TaxDocumentation),
  );
  const completionTitle = tPendingTranslation(
    'Your tax form has been submitted.',
    'Title shown after Taxbit SDK tax form submission succeeds.',
    translationKey('Taxes.Heading.TaxSubmissionCompleted', TranslationNamespace.TaxDocumentation),
  );
  const completionBody = tPendingTranslation(
    'Your tax status will be updated shortly.',
    'Body shown after Taxbit SDK tax form submission succeeds.',
    translationKey(
      'Taxes.Description.TaxSubmissionCompleted',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const curingCompletionTitle = tPendingTranslation(
    'Your additional information has been submitted.',
    'Title shown after the Taxbit SDK curing documentation is submitted successfully',
    translationKey(
      'Taxes.Heading.CuringDocumentationSubmitted',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const curingCompletionBody = tPendingTranslation(
    'Your tax status will be updated after the additional information is reviewed.',
    'Body shown after the Taxbit SDK curing documentation is submitted successfully',
    translationKey(
      'Taxes.Description.CuringDocumentationSubmitted',
      TranslationNamespace.TaxDocumentation,
    ),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Button label for returning to the taxes center after submission completes.',
    translationKey('Taxes.Action.Done', TranslationNamespace.TaxDocumentation),
  );
  const sessionExpiredTitle = tPendingTranslation(
    'Session expired',
    'Title for the modal shown when the Taxbit tax submission session expires.',
    translationKey('Taxes.Heading.SessionExpired', TranslationNamespace.TaxDocumentation),
  );
  const sessionExpiredBody = tPendingTranslation(
    'Your session has timed out. For your security, please start a new submission to continue.',
    'Body for the modal shown when the Taxbit tax submission session expires.',
    translationKey('Taxes.Description.SessionExpired', TranslationNamespace.TaxDocumentation),
  );
  const sessionExpiredOkLabel = tPendingTranslation(
    'OK',
    'Button label for leaving an expired Taxbit tax submission session.',
    translationKey('Taxes.Action.SessionExpiredOk', TranslationNamespace.TaxDocumentation),
  );

  if (isPageLoading) {
    return <TaxesLoading context='taxbit' label={loadingTaxFormLabel} />;
  }

  if (completedSubmission) {
    return (
      <TaxbitTaxSubmissionCompleteScreen
        title={completedSubmission === 'curing' ? curingCompletionTitle : completionTitle}
        body={completedSubmission === 'curing' ? curingCompletionBody : completionBody}
        doneLabel={doneLabel}
        onDone={handleCompletionDone}
      />
    );
  }

  if (isSessionExpired) {
    return (
      <TaxbitTaxSubmissionSessionExpiredDialog
        title={sessionExpiredTitle}
        body={sessionExpiredBody}
        okLabel={sessionExpiredOkLabel}
        onConfirm={handleSessionExpiredConfirm}
      />
    );
  }

  if (hasTaxbitLoadError) {
    return (
      <TaxesErrorState
        context='taxbit'
        message={taxbitLoadErrorMessage}
        retryLabel={tryAgainLabel}
        onRetry={retryTaxbitLoad}
      />
    );
  }

  if (isPasswordChangedBlocked) {
    return (
      <TaxbitTaxSubmissionAccountChangedDialog
        title={accountInformationChangedTitle}
        body={accountInformationChangedBody}
        contactSupportLabel={contactSupportLabel}
        closeLabel={closeLabel}
        onClose={closeAccountChangedDialog}
      />
    );
  }

  // Auth failure / cancelled 2SV / missing token: show the loading spinner while the effect above
  // redirects back to the taxes center.
  if (isTaxOnboardingError || isTaxOnboardingStatusError || !sdkToken) {
    return <TaxesLoading context='taxbit' label={loadingTaxFormLabel} />;
  }

  if (submissionMode === 'curing') {
    return (
      <TaxbitCuringDocumentation
        key={sdkToken}
        bearerToken={sdkToken}
        loadingLabel={loadingTaxFormLabel}
        onError={handleTaxbitError}
        onReady={handleFlowReady}
        onSuccess={handleCuringSubmissionComplete}
      />
    );
  }

  return (
    <TaxbitTaxSubmissionQuestionnaire
      key={sdkToken}
      bearerToken={sdkToken}
      loadingLabel={loadingTaxFormLabel}
      onError={handleTaxbitError}
      onReady={handleFlowReady}
      onStepViewed={handleStepViewed}
      onSuccess={handleTaxFormSubmissionComplete}
    />
  );
};

export default TaxbitTaxSubmissionPage;

import { UnifiedLogger } from '@rbx/unified-logger';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { useCallback, useRef } from 'react';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';

export enum LicenseManagerClickEvent {
  ViewListingDetailsClickEvent = 'viewListingDetailsClickEvent',
  ViewLicenseDetailsClickEvent = 'viewLicenseDetailsClickEvent',
  RequestLicenseClickEvent = 'requestLicenseClickEvent',
  SubmitLicenseRequestClickEvent = 'submitLicenseRequestClickEvent',
  CancelLicenseRequestNoExperienceSelectedClickEvent = 'cancelLicenseRequestNoExperienceSelectedClickEvent',
  CancelLicenseRequestYesClickEvent = 'cancelLicenseRequestYesClickEvent',
  CancelLicenseRequestNoClickEvent = 'cancelLicenseRequestNoClickEvent',
  SuccessfulLicenseRequestViewRequestsClickEvent = 'successfulLicenseRequestViewRequestsClickEvent',
  SuccessfulLicenseRequestBackToLicensesClickEvent = 'successfulLicenseRequestBackToLicensesClickEvent',
  ViewIpFamilyContentsClickEvent = 'viewIpFamilyContentsClickEvent',
  AddIpFamilyContentClickEvent = 'addIpFamilyContentClickEvent',
  ViewAgreementCandidateClickEvent = 'viewAgreementCandidateClickEvent',
  MatchesTableIpFamilyFilterClickEvent = 'matchesTableIpFamilyFilterClickEvent',
  MatchesTableDauRangeFilterClickEvent = 'matchesTableDauRangeFilterClickEvent',
  MatchesTableLifetimeVisitsRangeFilterClickEvent = 'matchesTableLifetimeVisitsRangeFilterClickEvent',
  MatchesTableContentMaturityFilterClickEvent = 'matchesTableContentMaturityFilterClickEvent',
  SuccessfulLicenseOfferViewAgreementClickEvent = 'successfulLicenseOfferViewAgreementClickEvent',
  MatchesTableClearFiltersClickEvent = 'matchesTableClearFiltersClickEvent',
  IphAgreementsTableSelectTabClickEvent = 'iphAgreementsTableSelectTabClickEvent',
  IphAgreementsTableSelectFilterClickEvent = 'iphAgreementsTableSelectFilterClickEvent',
  IphAgreementsTableViewAgreementClickEvent = 'iphAgreementsTableViewAgreementClickEvent',
  CreatorAgreementsTableViewAgreementClickEvent = 'creatorAgreementsTableViewAgreementClickEvent',
  CreatorAgreementsTableTabClickEvent = 'creatorAgreementsTableTabClickEvent',
  CreatorAgremementsTableExploreLicensesClickEvent = 'creatorAgremementsTableExploreLicensesClickEvent',
  IphListingsGridCreateListingClickEvent = 'iphListingsGridCreateListingClickEvent',
  IphListingsGridViewListingClickEvent = 'iphListingsGridViewListingClickEvent',
  IphListingsDetailsPageViewPublicListingClickEvent = 'iphListingsDetailsPageViewPublicListingClickEvent',
  IphListingsDetailsPageEditListingClickEvent = 'iphListingsDetailsPageEditListingClickEvent',
  IphListingsDetailsPageEditLicenseClickEvent = 'iphListingsDetailsPageEditLicenseClickEvent',
  IphListingsDetailsPageAddLicenseClickEvent = 'iphListingsDetailsPageAddLicenseClickEvent',
  IphListingsDetailsPageViewLicenseContentStandardsClickEvent = 'iphListingsDetailsPageViewLicenseContentStandardsClickEvent',
  IphListingsDetailsPageToggleLicenseVisibilityClickEvent = 'iphListingsDetailsPageToggleLicenseVisibilityClickEvent',
  IphAgreementDetailsPageSelectTabClickEvent = 'iphAgreementDetailsPageSelectTabClickEvent',
  IphAgreementDetailsPageOpenRequestModalClickEvent = 'iphAgreementDetailsPageOpenRequestModalClickEvent',
  IphAgreementDetailsPageCloseRequestModalClickEvent = 'iphAgreementDetailsPageCloseRequestModalClickEvent',
  IphAgreementDetailsPageOpenDisputeModalClickEvent = 'iphAgreementDetailsPageOpenDisputeModalClickEvent',
  IphAgreementDetailsPageCloseDisputeModalClickEvent = 'iphAgreementDetailsPageCloseDisputeModalClickEvent',
  IphAgreementDetailsPageOpenEnableMonetizationModalClickEvent = 'iphAgreementDetailsPageOpenEnableMonetizationModalClickEvent',
  IphAgreementDetailsPageCloseEnableMonetizationModalClickEvent = 'iphAgreementDetailsPageCloseEnableMonetizationModalClickEvent',
  IphAgreementDetailsPageViewTransactionsClickEvent = 'iphAgreementDetailsPageViewTransactionsClickEvent',
  CreatorAgreementDetailsPageSelectTabClickEvent = 'creatorAgreementDetailsPageSelectTabClickEvent',
  CreatorAgreementDetailsPageOpenDisputeModalClickEvent = 'creatorAgreementDetailsPageOpenDisputeModalClickEvent',
  CreatorAgreementDetailsPageCloseDisputeModalClickEvent = 'creatorAgreementDetailsPageCloseDisputeModalClickEvent',
  CreatorAgreementDetailsPageOpenCompleteChangeRequestModalClickEvent = 'creatorAgreementDetailsPageOpenCompleteChangeRequestModalClickEvent',
  CreatorAgreementDetailsPageCloseCompleteChangeRequestModalClickEvent = 'creatorAgreementDetailsPageCloseCompleteChangeRequestModalClickEvent',
  CreatorAgreementDetailsPageViewContentStandardsClickEvent = 'creatorAgreementDetailsPageViewContentStandardsClickEvent',
  CreatorAgreementDetailsPageOpenAbuseReportingClickEvent = 'creatorAgreementDetailsPageOpenAbuseReportingClickEvent',
  CreatorAgreementDetailsPageDismissAlertClickEvent = 'creatorAgreementDetailsPageDismissAlertClickEvent',
  IphAgreementDetailsPageOpenAbuseReportingClickEvent = 'iphAgreementDetailsPageOpenAbuseReportingClickEvent',
  IphAgreementDetailsPageDismissAlertClickEvent = 'iphAgreementDetailsPageDismissAlertClickEvent',
  IphAgreementDetailsPageArchiveAgreementClickEvent = 'iphAgreementDetailsPageArchiveAgreementClickEvent',
  IphAgreementDetailsPageOpenChangeRequestModalClickEvent = 'iphAgreementDetailsPageOpenChangeRequestModalClickEvent',
  IphAgreementDetailsPageCloseChangeRequestModalClickEvent = 'iphAgreementDetailsPageCloseChangeRequestModalClickEvent',
  ExploreLicensesSortDropdownClickEvent = 'exploreLicensesSortDropdownClickEvent',
  MatchesTableOpenManualScanRequestModalClickEvent = 'matchesTableOpenManualScanRequestModalClickEvent',
  MatchesTableCloseManualScanRequestModalClickEvent = 'matchesTableCloseManualScanRequestModalClickEvent',
  MatchesTableSelectTabClickEvent = 'matchesTableSelectTabClickEvent',
  MatchesTableViewApprovedManualScanCandidateAgreementClickEvent = 'matchesTableViewApprovedManualScanCandidateAgreementClickEvent',
  MatchesTableViewRejectedManualScanCandidateReasonClickEvent = 'matchesTableViewRejectedManualScanCandidateReasonClickEvent',
}

export enum LicenseManagerImpressionEvent {
  ViewListingDetailsImpressionEvent = 'viewListingDetailsImpressionEvent',
  SelectExperienceStepImpressionEvent = 'selectExperienceStepImpressionEvent',
  SelectCreationReadinessStepImpressionEvent = 'selectCreationReadinessStepImpressionEvent',
  AcknowledgeTermsStepImpressionEvent = 'acknowledgeTermsStepImpressionEvent',
  ReviewAndSubmitLicenseRequestStepImpressionEvent = 'reviewAndSubmitLicenseRequestStepImpressionEvent',
  SuccessfulLicenseOfferImpressionEvent = 'successfulLicenseOfferImpressionEvent',
  UnsuccessfulLicenseOfferGenericErrorImpressionEvent = 'unsuccessfulLicenseOfferGenericErrorImpressionEvent',
  UnsuccessfulLicenseOfferAgreementAlreadyExistsErrorImpressionEvent = 'unsuccessfulLicenseOfferAgreementAlreadyExistsErrorImpressionEvent',
  CreatorAgreementDetailsPageDisputeStepSelectReasonImpressionEvent = 'creatorAgreementDetailsPageDisputeStepSelectReasonImpressionEvent',
  CreatorAgreementDetailsPageDisputeStepAcknowledgeTermsImpressionEvent = 'creatorAgreementDetailsPageDisputeStepAcknowledgeTermsImpressionEvent',
  CreatorAgreementDetailsPageMaxDisputeConfirmationModalImpressionEvent = 'creatorAgreementDetailsPageMaxDisputeConfirmationModalImpressionEvent',
  MatchesTableManualScanRequestModalInvalidCombinationImpressionEvent = 'matchesTableManualScanRequestModalInvalidCombinationImpressionEvent',
  MatchesTableManualScanRequestModalDailyLimitReachedImpressionEvent = 'MatchesTableManualScanRequestModalDailyLimitReachedImpressionEvent',
  MatchesTableManualScanRequestModalInvalidIpFamilyImpressionEvent = 'MatchesTableManualScanRequestModalInvalidIpFamilyImpressionEvent',

  // Empty states
  EmptyStateMatchesTableNoValidExperiencesForThisCreatorImpressionEvent = 'emptyStateMatchesTableNoValidExperiencesForThisCreatorImpressionEvent',
  EmptyStateMatchesTableNoMatchesImpressionEvent = 'emptyStateMatchesTableNoMatchesImpressionEvent',
  EmptyStateMatchesTableNoMatchesWithAppliedFiltersImpressionEvent = 'emptyStateMatchesTableNoMatchesWithAppliedFiltersImpressionEvent',
  EmptyStateMatchesTableCreateIpFamilyImpressionEvent = 'emptyStateMatchesTableCreateIpFamilyImpressionEvent',
  EmptyStateMatchesTableNoPendingRequests = 'emptyStateMatchesTableNoPendingRequests',
  EmptyStateIphAgreementsTableNoRequestsImpressionEvent = 'emptyStateIphAgreementsTableNoRequestsImpressionEvent',
  EmptyStateIphAgreementsTableNoOffersImpressionEvent = 'emptyStateIphAgreementsTableNoOffersImpressionEvent',
  EmptyStateIphAgreementsTableNoActiveImpressionEvent = 'emptyStateIphAgreementsTableNoActiveImpressionEvent',
  EmptyStateIphAgreementsTableNoInactiveImpressionEvent = 'emptyStateIphAgreementsTableNoInactiveImpressionEvent',
  EmptyStateIphAgreementsTableCreateLicenseImpressionEvent = 'emptyStateIphAgreementsTableCreateLicenseImpressionEvent',
  EmptyStateCreatorAgreementsTableNoOffersImpressionEvent = 'emptyStateCreatorAgreementsTableNoOffersImpressionEvent',
  EmptyStateCreatorAgreementsTableNoRequestsImpressionEvent = 'emptyStateCreatorAgreementsTableNoRequestsImpressionEvent',
  EmptyStateCreatorAgreementsTableNoActiveImpressionEvent = 'emptyStateCreatorAgreementsTableNoActiveImpressionEvent',
  EmptyStateCreatorAgreementsTableNoInactiveImpressionEvent = 'emptyStateCreatorAgreementsTableNoInactiveImpressionEvent',
  EmptyStateIphListingsGridCreateListingImpressionEvent = 'emptyStateIphListingsGridCreateListingImpressionEvent',
  EmptyStateIphListingsGridCreateIpFamilyImpressionEvent = 'emptyStateIphListingsGridCreateIpFamilyImpressionEvent',
}

type LicenseManagerEventName = LicenseManagerImpressionEvent | LicenseManagerClickEvent;

const toUTCCalendarDay = (date: Date): string => {
  const offsetMillis = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMillis).toISOString().substring(0, 10);
};

const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const transformParameters = <T extends Record<string, string | number | boolean | Date>>(
  params: T,
): Record<string, string> => {
  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      acc[toSnakeCase(key)] = value instanceof Date ? toUTCCalendarDay(value) : String(value);
      return acc;
    },
    {} as Record<string, string>,
  );
};

/**
 * Internal implementation for logging license manager events.
 * This function handles the core logic of validating event types and calling the appropriate
 * unified logger methods. It's used by both the standalone function and the React hook.
 */
const logLicenseManagerEventInternal = <T extends Record<string, string | number | boolean | Date>>(
  client: UnifiedLogger,
  eventName: LicenseManagerEventName,
  params: T,
) => {
  const isImpressionEvent = isValidEnumValue(LicenseManagerImpressionEvent, eventName);
  const isClickEvent = isValidEnumValue(LicenseManagerClickEvent, eventName);

  if (!isImpressionEvent && !isClickEvent) {
    throw new Error(`Invalid event: ${eventName}`);
  }

  const transformedParams = transformParameters(params);

  if (isImpressionEvent) {
    client.logImpressionEvent({ eventName, parameters: transformedParams });
  } else {
    client.logClickEvent({ eventName, parameters: transformedParams });
  }
};

/**
 * React hook for logging license manager events.
 * Preferred API for React components - no need to pass unifiedLogger.
 */
export const useLicenseManagerLogger = () => {
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const logEvent = useCallback(
    (
      eventName: LicenseManagerEventName,
      params: Record<string, string | number | boolean | Date> = {},
    ) => {
      logLicenseManagerEventInternal(unifiedLogger, eventName, params);
    },
    [unifiedLogger],
  );

  return {
    logEvent,
  };
};

/**
 * React hook for logging license manager events only once per component lifecycle.
 * Useful for impression events that should only fire once when a component mounts.
 */
export const useLicenseManagerLoggerLogOnce = () => {
  const { logEvent } = useLicenseManagerLogger();
  const loggedEventsRef = useRef<Set<string>>(new Set());

  const logOnce = useCallback(
    (
      eventName: LicenseManagerEventName,
      params: Record<string, string | number | boolean | Date> = {},
    ) => {
      if (loggedEventsRef.current.has(eventName)) {
        return;
      }

      loggedEventsRef.current.add(eventName);
      logEvent(eventName, params);
    },
    [logEvent],
  );

  return {
    logOnce,
  };
};

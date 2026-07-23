import { AdPolicyReviewLabelType, StatementOfReasonsModal } from '@rbx/ads-moderation-ui';
import { DialogTitle } from '@rbx/foundation-ui';
import { type ReactElement, useCallback } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { DefaultTimeZone } from '@constants/campaignBuilder';
import { StatusText } from '@constants/campaignStatus';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { convertMsToVerboseDate } from '@modules/miscellaneous/utils/dateUtilities';
import { type AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

interface StatementOfReasonsDialogProps extends BaseInjectedDialogProps {
  adPolicyReviewLabels: AdPolicyReviewLabelType[];
  adPolicyReviewUpdatedTimestampMs: number;
  appealUrl?: string;
  assetId: number | undefined;
  headingKey?: string;
  isLabelRejected?: boolean;
}

const StatementOfReasonsDialog = ({
  adPolicyReviewLabels,
  adPolicyReviewUpdatedTimestampMs,
  appealUrl,
  assetId,
  headingKey = 'Heading.AdRemoved',
  isLabelRejected = true,
  onClose,
}: StatementOfReasonsDialogProps): ReactElement => {
  const { translate: translateReport, translateHTML } = useNamespacedTranslation(
    TranslationNamespace.Report,
  );
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { organizationInfo } = useAppStore((state: AppStoreType) => state.appData);

  // The shared `StatementOfReasonsModal` renders all of its copy from the
  // Report namespace except the generic `Action.Close` button label, which is
  // defined in Misc. The modal only accepts a single `translate`, so compose
  // one that routes that one key to Misc and everything else to Report;
  // otherwise the Close button would render the raw key.
  const translate = useCallback(
    (key: string, args?: { [key: string]: string }): string =>
      key === 'Action.Close' ? translateMisc(key, args) : translateReport(key, args),
    [translateMisc, translateReport],
  );

  const timeZone = organizationInfo?.time_zone
    ? GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName
    : DefaultTimeZone.timezoneDbName;

  return (
    // The legacy `StatementOfReasonsModal` package component owns its own
    // heading typography + Close/Appeal footer, so we render it directly
    // inside the Foundation dialog. A visually-hidden `<DialogTitle>` is
    // required by Foundation for screen reader accessibility.
    <>
      <DialogTitle hidden>{translate(headingKey)}</DialogTitle>
      <StatementOfReasonsModal
        adPolicyReviewLabels={adPolicyReviewLabels}
        appealUrl={appealUrl}
        assetId={assetId}
        decisionDate={convertMsToVerboseDate(adPolicyReviewUpdatedTimestampMs, timeZone)}
        headingKey={headingKey}
        isLabelRejected={isLabelRejected}
        onClose={onClose}
        translate={translate}
        translateHTML={translateHTML}
      />
    </>
  );
};

/**
 * Pure predicate — does NOT touch React state, callable from anywhere.
 * Returns true iff the status is `DISPLAY_STATUS_REJECTED` and at least one
 * ad-policy-review label is specified (i.e. there is something to explain
 * to the advertiser).
 */
export const shouldShowStatementOfReasons = (
  statusText: StatusText,
  adPolicyReviewLabels: AdPolicyReviewLabelType[],
): boolean =>
  statusText === StatusText.DISPLAY_STATUS_REJECTED &&
  adPolicyReviewLabels.some(
    (label) => label !== AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNSPECIFIED,
  );

type OpenParams = Omit<StatementOfReasonsDialogProps, keyof BaseInjectedDialogProps>;

/**
 * Imperative opener for the statement-of-reasons (ad rejection details) dialog.
 * The dialog computes its own timezone + verbose decision date from the app
 * store so callers only need to pass the raw moderation params.
 */
export const openStatementOfReasonsDialog = (params: OpenParams): void => {
  openDialog({ component: StatementOfReasonsDialog, props: params });
};

export default StatementOfReasonsDialog;

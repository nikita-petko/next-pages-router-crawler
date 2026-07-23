import { Button } from '@rbx/foundation-ui';
import { type ReactElement, type ReactNode } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import type { AMAErrorResponseType } from '@type/errorResponse';

const INELIGIBLE_SPEND_OBJECTIVE_MESSAGE = "Campaign.Objective cannot be '8'";

interface EntitySubmitErrorDialogProps extends BaseInjectedDialogProps {
  /**
   * Whether the failed submission was an edit (vs. a create). Drives the
   * default dialog title (`Edit failed` vs `Creation failed`). Some
   * error-code branches override the title regardless.
   */
  editMode: boolean;
  errorResponse: AMAErrorResponseType;
}

/**
 * Domain error dialog for campaign / adset / ad submission failures.
 *
 * The shape — title + body + Close button — comes from `BaseDialog`. The
 * 13 branches below mirror the original `useEntitySubmitModal` switch and
 * must be kept in lockstep with backend error codes; any change needs a
 * corresponding test branch.
 */
const EntitySubmitErrorDialog = ({
  editMode,
  errorResponse,
  onClose,
}: EntitySubmitErrorDialogProps): ReactElement => {
  const { translate: translateError } = useNamespacedTranslation(TranslationNamespace.Error);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const errorCode = errorResponse?.error?.code;
  const errorMessage = errorResponse?.error?.message;

  let title = editMode
    ? translateError('Heading.EditFailed')
    : translateError('Heading.CreationFailed');

  let body: ReactNode = (
    <div className='flex flex-col gap-y-small'>
      <span>{errorMessage}</span>
      {errorCode ? (
        <span className='content-muted'>
          {translateError('Label.ErrorCode', { errorCode: String(errorCode) })}
        </span>
      ) : null}
    </div>
  );

  switch (errorCode) {
    case ErrorCodes.INVALID_ARGUMENT:
      if (errorMessage === 'Campaign.TargetingCriteria.GenreCriteria') {
        body = translateError('Description.GenreIncompatible');
      } else if (errorMessage === 'Campaign.TargetingCriteria.AgeBucketCriteria') {
        body = translateError('Description.AgeIncompatible');
      } else if (errorMessage === 'Campaign.Budget.ScheduledBudgetMicroUsd') {
        body = translateError('Description.BudgetTooLow');
      } else if (errorMessage === INELIGIBLE_SPEND_OBJECTIVE_MESSAGE) {
        body = translateError('Description.UniverseNotEligibleForEarningsGoal');
      } else {
        body = translateError('Description.GenericRetryError');
      }
      break;
    case ErrorCodes.RATE_LIMITED:
      title = translateError('Heading.TakeABreak');
      body = translateError('Description.RateLimited');
      break;
    case ErrorCodes.OFF_PLATFORM_CAMPAIGN_LIMIT_REACHED:
      title = translateError('Heading.OffPlatformCampaignLimitReached');
      body = translateError('Description.OffPlatformCampaignLimit');
      break;
    case ErrorCodes.CAMPAIGN_LIMIT_REACHED:
      title = translateError('Heading.CampaignLimitReached');
      body = translateError('Description.CampaignLimit');
      break;
    case ErrorCodes.AD_SET_LIMIT_REACHED:
      title = translateError('Heading.AdSetLimitReached');
      body = translateError('Description.AdSetLimit');
      break;
    case ErrorCodes.AD_LIMIT_REACHED:
      title = translateError('Heading.AdLimitReached');
      body = translateError('Description.AdLimit');
      break;
    case ErrorCodes.VALIDATE_DISPLAY_NAME_FAILED:
      body = translateError('Description.InvalidDisplayName');
      break;
    case ErrorCodes.FORBIDDEN_ACTION:
      body = translateError('Description.ForbiddenImpersonation');
      break;
    case ErrorCodes.MULTIPLE_UNIVERSES:
      body = (
        <div className='flex flex-col gap-y-small'>
          <span>{translateError('Description.MultipleUniversesDisabled')}</span>
          <span className='content-muted'>
            {translateError('Label.ErrorCode', { errorCode: String(errorCode) })}
          </span>
        </div>
      );
      break;
    default:
      break;
  }

  return (
    <BaseDialog
      dialogBody={body}
      dialogFooter={
        <Button onClick={onClose} size='Medium' variant='Standard'>
          {translateMisc('Action.Close')}
        </Button>
      }
      dialogTitle={title}
    />
  );
};

/**
 * Imperative trigger for the campaign/adset/ad submission error dialog.
 * Replaces every call of `useEntitySubmitModal().handleEntitySubmitErrorResponse`.
 *
 * Pass `editMode: true` when the failure happened during an edit
 * (`Heading.EditFailed`) vs. `false` for a create (`Heading.CreationFailed`).
 * The `editMode` was previously read off `useCampaignBuilderStore`; the
 * imperative API now requires the caller to pass it explicitly so the
 * dialog can be opened from non-React contexts and from screens that don't
 * own the campaign builder store.
 */
export const openEntitySubmitErrorDialog = (
  errorResponse: AMAErrorResponseType,
  { editMode }: { editMode: boolean },
): void => {
  openDialog({
    component: EntitySubmitErrorDialog,
    props: { editMode, errorResponse },
  });
};

export default EntitySubmitErrorDialog;

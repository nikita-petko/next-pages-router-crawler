import React, { ReactElement } from 'react';
import { AccessTimeIcon, CheckCircleOutlineIcon, InfoOutlinedIcon } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  AgreementStatus,
  AgreementTransition,
  ChangeRequestSubstatusType,
  HydratedAgreementWithHydratedTargetsResponse,
  HydratedListAgreementResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import normalizeTerminatesAt from '../utils/agreement';

import StatusLabel, { variants } from '../../../components/StatusLabel';

interface content {
  icon: ReactElement | undefined;
  variant: variants | undefined;
  text: string;
  textWithDate: string | undefined;
}

// Interim status labels that are not tied to an AgreementStatus
const terminatesOnContent: content = {
  icon: <AccessTimeIcon fontSize='inherit' />,
  variant: 'error',
  text: 'Label.PendingTermination',
  textWithDate: 'Label.TerminatesOnDate',
};
const changeRequestRequiresActionContent: content = {
  icon: <AccessTimeIcon fontSize='inherit' />,
  variant: 'error',
  text: 'Label.RequiresAction',
  textWithDate: undefined,
};

const statusToContent: { [key in AgreementStatus]: content } = {
  Pending: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'warning',
    text: 'Label.PendingActivation',
    textWithDate: 'Label.ActivatesOnDate',
  },
  Active: {
    icon: <CheckCircleOutlineIcon fontSize='inherit' />,
    variant: 'success',
    text: 'Label.Active',
    textWithDate: undefined,
  },
  Disputed: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'error',
    text: 'Label.DisputedRequiresAction',
    textWithDate: 'Label.DisputedRequiresActionWithDate',
  },
  Archived: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Archived',
    textWithDate: undefined,
  },
  Unsuccessful: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Unsuccessful',
    textWithDate: undefined,
  },
  Inquired: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'error',
    text: 'Label.RequiresAction',
    textWithDate: undefined,
  },
  Terminated: {
    icon: <CheckCircleOutlineIcon fontSize='inherit' />,
    variant: 'error',
    text: 'Label.Terminated',
    textWithDate: undefined,
  },
  Accepted: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: 'success',
    text: 'Label.PendingActivation',
    textWithDate: 'Label.ActivatesOnDate',
  },
  Expired: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Expired',
    textWithDate: undefined,
  },
  Cancelled: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Cancelled',
    textWithDate: undefined,
  },
  // The following statuses should never have alerts shown
  None: {
    icon: undefined,
    variant: undefined,
    text: '',
    textWithDate: undefined,
  },
  Invalid: {
    icon: undefined,
    variant: undefined,
    text: '',
    textWithDate: undefined,
  },
};

interface Props {
  agreement: HydratedListAgreementResponse | HydratedAgreementWithHydratedTargetsResponse;
  isCompact?: boolean;
}

/** Provides two sets of status.
 * 1. If `isCompact` is true, provides shorter status, suitable for table and compact views.
 * 2. If false, provides longer statuses suitable for details pages.
 */
const IphAgreementStatusLabel: React.FC<Props> = ({ agreement, isCompact = false }) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  if (!agreement || !agreement.status) {
    return null;
  }

  const { status } = agreement;
  const isPendingTermination =
    status === AgreementStatus.Active && normalizeTerminatesAt(agreement.terminatesAt);
  const date = isPendingTermination ? agreement.terminatesAt : agreement.statusExpireAt;
  let content = isPendingTermination ? terminatesOnContent : statusToContent[status];

  if (status === AgreementStatus.Active) {
    if (
      agreement.activeChangeRequest?.changeRequestSubstatusType ===
      ChangeRequestSubstatusType.IphActionRequired
    ) {
      // Handles agreement table
      content = changeRequestRequiresActionContent;
    }
    if ('activityLog' in agreement && agreement.activityLog?.[0]) {
      // TODO - GTCM-92 - aquach - Clean up agreement.activityLog in favor of agreement.activeChangeRequest
      // Handles details page
      const { transition } = agreement.activityLog[0];
      if (transition === AgreementTransition.CompleteChangeRequest) {
        content = changeRequestRequiresActionContent;
      }
    }
  }

  let text = translate(content.text);
  if (!isCompact && date && content.textWithDate) {
    text = translate(content.textWithDate, {
      date: date.toLocaleDateString(locale ?? Locale.English, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    });
  }

  return <StatusLabel icon={content.icon} text={text} variant={content.variant} />;
};

export default IphAgreementStatusLabel;

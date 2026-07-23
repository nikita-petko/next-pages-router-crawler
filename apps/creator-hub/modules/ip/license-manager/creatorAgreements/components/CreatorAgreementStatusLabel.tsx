import React, { ReactElement } from 'react';
import { AccessTimeIcon, CheckCircleOutlineIcon, InfoOutlinedIcon } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  AgreementStatus,
  AgreementTransition,
  ChangeRequestSubstatusType,
  HydratedAgreementWithHydratedTargetsResponse,
} from '@rbx/clients/contentLicensingApi/v1';

import StatusLabel, { variants } from '../../../components/StatusLabel';

interface content {
  icon: ReactElement | undefined;
  variant: variants | undefined;
  text: string;
  textWithDate: string | undefined;
}

// Interim status labels that are not tied to an AgreementStatus
const creatorActionRequired: content = {
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
    variant: 'warning',
    text: 'Label.Disputed',
    textWithDate: 'Label.Disputed',
  },
  Archived: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Archived',
    textWithDate: undefined,
  },
  Unsuccessful: {
    // Creator is never shown Unsuccessful state in text; instead, show Archived
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Archived',
    textWithDate: undefined,
  },
  Inquired: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'warning',
    text: 'Label.PendingReview',
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
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  isCompact?: boolean;
}

/** Provides two sets of status.
 * 1. If `isCompact` is true, provides shorter status, suitable for table and compact views.
 * 2. If false, provides longer statuses suitable for details pages.
 */
const CreatorAgreementStatusLabel: React.FC<Props> = ({ agreement, isCompact = false }) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  if (!agreement || !agreement.status) {
    return null;
  }

  const { status, activityLog, activeChangeRequest, ipRemovalAttestation, statusExpireAt } =
    agreement;
  let date = statusExpireAt;
  let content = statusToContent[status];

  if (status === AgreementStatus.Active) {
    if (
      activeChangeRequest?.changeRequestSubstatusType ===
      ChangeRequestSubstatusType.CreatorActionRequired
    ) {
      // Handles agreement table
      content = creatorActionRequired;
    }
    if (activityLog && activityLog[0]) {
      // TODO - GTCM-92 - aquach - Clean up agreement.activityLog in favor of agreement.activeChangeRequest
      // Handles details page
      const { transition } = activityLog[0];
      if (transition === AgreementTransition.InitiateChangeRequest) {
        content = creatorActionRequired;
      }
    }
  }
  if (status === AgreementStatus.Terminated && ipRemovalAttestation?.ipRemovalAttestationStatus) {
    content = creatorActionRequired;
    date = ipRemovalAttestation.expiresAtTime;
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

export default CreatorAgreementStatusLabel;

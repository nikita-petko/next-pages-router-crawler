import type { ReactElement } from 'react';
import React from 'react';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { AccessTimeIcon, InfoOutlinedIcon, Skeleton, TableCell, Typography } from '@rbx/ui';
import type { variants } from '../../../components/StatusLabel';
import StatusLabel from '../../../components/StatusLabel';
import type {
  AgreementStatusBatchItemError,
  AgreementStatusesById,
} from '../hooks/useAgreementStatusesByIdsQuery';

export interface AgreementStatusesColumnProps {
  statusByAgreementId: AgreementStatusesById | undefined;
  errorsByAgreementId?: Record<string, AgreementStatusBatchItemError> | undefined;
  isPending: boolean;
  isError: boolean;
}

interface content {
  icon: ReactElement | undefined;
  variant: variants | undefined;
  text: string;
}

const noOfferSentContent: content = {
  icon: <InfoOutlinedIcon fontSize='inherit' />,
  variant: undefined,
  text: 'Label.NoOfferSent',
};
const unknownContent: content = {
  icon: <InfoOutlinedIcon fontSize='inherit' />,
  variant: undefined,
  text: 'Label.Unknown',
};
const errorContent: content = {
  icon: <InfoOutlinedIcon fontSize='inherit' />,
  variant: 'error',
  text: 'Label.ErrorFetchingStatus',
};

export const statusToContent: { [key in AgreementStatus]: content } = {
  Disputed: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'error',
    text: 'Label.Disputed',
  },
  Inquired: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: 'warning',
    text: 'Label.CreatorRequested',
  },
  Accepted: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: 'success',
    text: 'Label.Accepted',
  },
  // The following statuses should default to "No offer sent"
  Archived: noOfferSentContent,
  Cancelled: noOfferSentContent,
  Expired: noOfferSentContent,
  Terminated: noOfferSentContent,
  Unsuccessful: noOfferSentContent,
  // The following statuses should not appear in the returned response when ListAgreementCandidatesByAccount is called
  Active: unknownContent,
  Invalid: unknownContent,
  None: unknownContent,
  Pending: unknownContent,
  // TODO - aquach/anagajaran - PROV-5 - Handle conditional offer visual treatment
  ConditionalOffer: unknownContent,
};

export interface MatchStatusLabelProps {
  status: AgreementStatus | undefined;
  isError?: boolean;
  /** Render the chip with fully rounded (pill) ends instead of the default boxy corners. */
  pill?: boolean;
}

/** Chip-style status used in the matches table and match details drawer (single source of truth). */
export const MatchStatusLabel: React.FC<MatchStatusLabelProps> = ({ status, isError, pill }) => {
  const { translate } = useTranslation();

  let content = noOfferSentContent;
  if (isError) {
    content = errorContent;
  }
  if (status) {
    content = statusToContent[status];
  }

  return (
    <StatusLabel
      icon={content.icon}
      text={translate(content.text)}
      variant={content.variant}
      pill={pill}
    />
  );
};

export interface AgreementStatusFromBatchMapsProps {
  agreementId: string | null | undefined;
  column: AgreementStatusesColumnProps;
  /** Render the chip with fully rounded (pill) ends instead of the default boxy corners. */
  pill?: boolean;
}

/**
 * Renders one agreement’s status by reading that id from the per-agreement maps returned by the
 * batch get-agreement-statuses query (same logic as {@link IphMatchStatusLabel}, without the table cell).
 */
export const AgreementStatusFromBatchMaps: React.FC<AgreementStatusFromBatchMapsProps> = ({
  agreementId,
  column,
  pill,
}) => {
  const { translate } = useTranslation();

  if (!agreementId) {
    return <MatchStatusLabel status={undefined} pill={pill} />;
  }

  if (column.isError) {
    return (
      <Typography color='error' variant='body2'>
        {translate('Error.LoadingData')}
      </Typography>
    );
  }

  const rowError = column.errorsByAgreementId?.[agreementId];
  if (rowError) {
    return <MatchStatusLabel status={undefined} isError pill={pill} />;
  }

  const status = column.statusByAgreementId?.[agreementId];
  if (status === undefined) {
    if (column.isPending) {
      return <Skeleton variant='text' animate width='50%' />;
    }
    return <MatchStatusLabel status={AgreementStatus.None} pill={pill} />;
  }

  return <MatchStatusLabel status={status} pill={pill} />;
};

interface IphMatchStatusLabelProps {
  agreementId: string | null | undefined;
  column: AgreementStatusesColumnProps;
}

/**
 * Table cell for IPH matches: batch agreement status, loading, error, or “no offer sent”.
 */
const IphMatchStatusLabel: React.FC<IphMatchStatusLabelProps> = ({ agreementId, column }) => (
  <TableCell>
    <AgreementStatusFromBatchMaps agreementId={agreementId} column={column} />
  </TableCell>
);

export default IphMatchStatusLabel;

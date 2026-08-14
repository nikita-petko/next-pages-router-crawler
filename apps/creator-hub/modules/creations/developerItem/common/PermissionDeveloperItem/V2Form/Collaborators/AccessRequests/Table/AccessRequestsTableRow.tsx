import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, TableCell, TableRow } from '@rbx/ui';
import type { AssetPermissionRequest } from '@modules/clients/assetPermissions';
import {
  useApproveAssetPermissionRequest,
  useRejectAssetPermissionRequest,
} from '@modules/react-query/assetPermissions/assetAccessRequestsQueries';
import useAccessRequestsTableStyles from './AccessRequestsTable.styles';

export type AccessRequestsTableRowProps = {
  assetId: number;
  request: AssetPermissionRequest;
  requesterDisplay: string;
};

const AccessRequestsTableRow: FC<AccessRequestsTableRowProps> = ({
  assetId,
  request,
  requesterDisplay,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { requesterCell, dateCell, actionsCell },
  } = useAccessRequestsTableStyles();
  const { mutate: approveRequest, isPending: isApproving } =
    useApproveAssetPermissionRequest(assetId);
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectAssetPermissionRequest(assetId);
  const isProcessing = isApproving || isRejecting;

  const handleAccept = useCallback(() => {
    if (request.requestId !== undefined) {
      approveRequest(request.requestId);
    }
  }, [approveRequest, request.requestId]);
  const handleDecline = useCallback(() => {
    if (request.requestId !== undefined) {
      rejectRequest(request.requestId);
    }
  }, [rejectRequest, request.requestId]);

  const formattedDate = useMemo(
    () =>
      request.createdAt
        ? // undefined locale → user's browser locale; field order adapts (MM/DD/YYYY vs DD/MM/YYYY etc.)
          new Intl.DateTimeFormat(undefined, {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }).format(request.createdAt)
        : '',
    [request.createdAt],
  );

  return (
    <TableRow data-testid={`access-request-row-${request.requestId}`}>
      <TableCell classes={{ root: requesterCell }}>{requesterDisplay}</TableCell>
      <TableCell classes={{ root: dateCell }}>{formattedDate}</TableCell>
      <TableCell classes={{ root: actionsCell }} align='right'>
        <div className='inline-flex gap-small'>
          <Button
            color='primaryBrand'
            variant='contained'
            disabled={isProcessing}
            onClick={handleAccept}>
            {translate('Action.Accept')}
          </Button>
          <Button
            color='secondary'
            variant='outlined'
            disabled={isProcessing}
            onClick={handleDecline}>
            {translate('Action.Decline')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AccessRequestsTableRow;

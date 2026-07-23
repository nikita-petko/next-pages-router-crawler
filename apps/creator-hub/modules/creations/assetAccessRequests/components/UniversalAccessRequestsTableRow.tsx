import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Checkbox, TableCell, TableRow } from '@rbx/ui';
import type { AssetPermissionRequest } from '@modules/clients/assetPermissions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useApproveAssetPermissionRequest,
  useRejectAssetPermissionRequest,
} from '@modules/react-query/assetPermissions/assetAccessRequestsQueries';
import { TRUNCATING_CELL_CLASS } from './UniversalAccessRequestsTable.styles';

export type UniversalAccessRequestsTableRowProps = {
  request: AssetPermissionRequest;
  isSelected: boolean;
  onSelectionChange: (requestId: string, isSelected: boolean) => void;
};

const UniversalAccessRequestsTableRow: FC<UniversalAccessRequestsTableRowProps> = ({
  request,
  isSelected,
  onSelectionChange,
}) => {
  const { translateWithNamespace } = useTranslation();

  // Per-row mutation hooks avoid the TanStack concurrent mutation issue where
  // a second mutate() call overwrites onSettled of the first.
  const { mutate: approveRequest, isPending: isApproving } = useApproveAssetPermissionRequest(
    request.assetId,
  );
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectAssetPermissionRequest(
    request.assetId,
  );
  const isProcessing = isApproving || isRejecting;

  const handleCheckboxChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      onSelectionChange(request.requestId, checked);
    },
    [onSelectionChange, request.requestId],
  );

  const handleAccept = useCallback(
    () => approveRequest(request.requestId),
    [approveRequest, request.requestId],
  );

  const handleDecline = useCallback(
    () => rejectRequest(request.requestId),
    [rejectRequest, request.requestId],
  );

  const groupLabel =
    request.requesterGroupName ??
    translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.NotApplicable');

  // undefined locale → user's browser locale; field order adapts (MM/DD/YYYY vs DD/MM/YYYY etc.)
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }).format(new Date(request.createdAt)),
    [request.createdAt],
  );

  return (
    <TableRow data-testid={`universal-access-request-row-${request.requestId}`}>
      <TableCell className='[width:5%]' padding='checkbox'>
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          inputProps={{
            'aria-label': translateWithNamespace(
              TranslationNamespace.AssetPermissions,
              'Label.SelectRequest',
            ),
          }}
        />
      </TableCell>
      <TableCell className={`[width:22%] ${TRUNCATING_CELL_CLASS}`}>
        {`@${request.requesterUsername}`}
      </TableCell>
      <TableCell className={`[width:18%] ${TRUNCATING_CELL_CLASS}`}>{groupLabel}</TableCell>
      <TableCell className={`[width:20%] ${TRUNCATING_CELL_CLASS}`}>
        {request.assetName ?? String(request.assetId)}
      </TableCell>
      <TableCell className='[width:15%]'>{formattedDate}</TableCell>
      <TableCell className='[width:20%]' align='right'>
        <div className='inline-flex gap-small'>
          <Button
            color='primaryBrand'
            variant='contained'
            disabled={isProcessing}
            onClick={handleAccept}>
            {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Action.Accept')}
          </Button>
          <Button
            color='secondary'
            variant='outlined'
            disabled={isProcessing}
            onClick={handleDecline}>
            {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Action.Decline')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UniversalAccessRequestsTableRow;

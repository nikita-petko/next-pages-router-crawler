import Link from 'next/link';
import type { FunctionComponent } from 'react';
import React from 'react';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { PageLoading, Pagination } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCursorPagination, { usePaginationProps } from '../../hooks/useCursorPagination';
import {
  RMCreateClaimFeatureName,
  useGetRightsFeatureTimeoutIntervention,
} from '../../hooks/useInterventions';
import useListClaims from '../../hooks/useListClaims';
import { CREATE_REMOVAL_REQUEST_HREF, REPORT_CODE_REMOVAL_REQUESTS_HREF } from '../../urls';
import ClaimCreationRestrictionBanner from '../error/ClaimCreationRestrictionBanner';
import EmptyRequestsView from './EmptyRequestsView';
import RemovalRequestRow from './RemovalRequestRow';

interface RemovalRequestsProps {
  accountId: string;
  accountStatus: string;
}

// RemovalRequests displays a paginated list of auto-escalated claims.
const RemovalRequests: FunctionComponent<React.PropsWithChildren<RemovalRequestsProps>> = ({
  accountId,
  accountStatus,
}) => {
  const { ready, translate } = useTranslation();

  const { onPageChange, pageToken, pagination, rowsPerPage } = useCursorPagination();

  const { claims, nextPageToken, isPending, isPlaceholderData, error } = useListClaims(
    accountId,
    rowsPerPage[0],
    pageToken || '',
  );

  const { intervention } = useGetRightsFeatureTimeoutIntervention(
    RMCreateClaimFeatureName,
    accountId,
  );
  const isBlockedByFeatureTimeout = !!intervention;

  const { paginationProps } = usePaginationProps(
    nextPageToken,
    pagination.pageIndex,
    onPageChange,
    isPlaceholderData,
  );

  const {
    isFetched: isIXPFetched,
    params: { enableInExperienceIpReporting },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });

  if (error) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
      />
    );
  }

  if (isPending || !ready || !isIXPFetched) {
    return <PageLoading />;
  }

  if (accountStatus !== AccountStatusEnum.Verified) {
    return null;
  }

  const isEmpty = claims.length === 0;
  if (isEmpty) {
    return <EmptyRequestsView />;
  }

  return (
    <Grid container direction='column' spacing={3}>
      {isBlockedByFeatureTimeout && (
        <Grid item>
          <ClaimCreationRestrictionBanner intervention={intervention} />
        </Grid>
      )}
      <Grid item sx={{ display: 'flex', gap: '8px' }}>
        <Link href={CREATE_REMOVAL_REQUEST_HREF} passHref legacyBehavior>
          <Button
            variant='contained'
            color='primaryBrand'
            disabled={accountStatus !== AccountStatusEnum.Verified || isBlockedByFeatureTimeout}>
            {translate('Label.NewRemovalRequest')}
          </Button>
        </Link>
        {enableInExperienceIpReporting && (
          <Link href={REPORT_CODE_REMOVAL_REQUESTS_HREF} passHref legacyBehavior>
            <Button variant='contained' color='secondary'>
              {translate('Label.UseReportCode')}
            </Button>
          </Link>
        )}
      </Grid>
      <Grid item>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width='30px' />
                <TableCell>{translate('Label.NameOfRequest')}</TableCell>
                <TableCell>{translate('Label.ID')}</TableCell>
                <TableCell>{translate('Label.Status')}</TableCell>
                <TableCell>{translate('Label.SubmittedDate')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims?.map((claim) => {
                return <RemovalRequestRow key={claim.id} claim={claim} accountId={accountId} />;
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!isEmpty && <Pagination {...paginationProps} />}
      </Grid>
    </Grid>
  );
};

export default withTranslation(RemovalRequests, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);

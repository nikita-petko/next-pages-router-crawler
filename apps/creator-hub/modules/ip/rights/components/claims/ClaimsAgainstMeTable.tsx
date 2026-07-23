import type { Account } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  makeStyles,
} from '@rbx/ui';
import { PageLoading, Pagination } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCursorPagination, { usePaginationProps } from '../../hooks/useCursorPagination';
import useListIncomingClaimItems from '../../hooks/useListIncomingClaimItems';
import ClaimAgainstMeRow from './ClaimAgainstMeRow';

const useStyles = makeStyles()(() => ({
  table: {
    tableLayout: 'fixed',
  },
  description: {
    width: '21%',
  },
}));

/**
 *  ClaimsAgainstMeTable displays a table of claims filed against me
 */
const ClaimsAgainstMeTable = ({ account }: { account: Account }) => {
  const { ready, translate } = useTranslation();

  const {
    classes: { table, description },
  } = useStyles();

  const { onPageChange, pageToken, pagination, rowsPerPage } = useCursorPagination();

  const { claimItemGroups, nextPageToken, isPending, isPlaceholderData, error } =
    useListIncomingClaimItems(account.id || '', rowsPerPage[0], pageToken || '');

  const { paginationProps } = usePaginationProps(
    nextPageToken,
    pagination.pageIndex,
    onPageChange,
    isPlaceholderData,
  );

  if (error) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
      />
    );
  }

  if (isPending || !ready) {
    return <PageLoading />;
  }

  const filteredClaimItemGroups = claimItemGroups?.filter(
    (claimItemGroup) => claimItemGroup.length > 0,
  );

  return (
    <Grid container direction='column' sx={{ marginTop: '0px' }}>
      <Grid item container direction='column' spacing={3}>
        <Grid item>
          <TableContainer>
            <Table className={table}>
              <TableHead>
                <TableRow>
                  <TableCell className={description}>{translate('Label.MyCreation')}</TableCell>
                  <TableCell className={description}>{translate('Label.Status')}</TableCell>
                  <TableCell className={description}>
                    {translate('Description.Usability')}
                  </TableCell>
                  <TableCell className={description}>
                    {translate('Description.Monetization')}
                  </TableCell>
                  <TableCell className={description}>
                    {translate('Description.Discoverability')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClaimItemGroups?.map((claimItemGroup) => (
                  <ClaimAgainstMeRow key={claimItemGroup[0].id || ''} claimItems={claimItemGroup} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item>
          <Pagination {...paginationProps} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(ClaimsAgainstMeTable, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);

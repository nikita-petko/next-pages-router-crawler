import Link from 'next/link';
import { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Typography, CircularProgress } from '@rbx/ui';
import { Pagination } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IpLoadError from '../../components/error/IpLoadError';
import useCursorPagination, { usePaginationProps } from '../../rights/hooks/useCursorPagination';
import IpFamiliesTable from '../components/IpFamiliesTable';
import { usePaginatedIpFamiliesQuery } from '../hooks/ipFamily';
import { IP_FAMILY_CREATE_HREF } from '../urls';

/**
 * Page that lists IP Families
 */
const IpFamiliesContainer = () => {
  const { translate } = useTranslation();
  const { onPageChange, pageToken, pagination } = useCursorPagination();
  const { data, isLoading, isPlaceholderData, error } = usePaginatedIpFamiliesQuery({
    pageSize: pagination.pageSize,
    pageToken: pageToken || '',
  });

  const { paginationProps } = usePaginationProps(
    data?.nextPageToken,
    pagination.pageIndex,
    onPageChange,
    isPlaceholderData,
  );
  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <IpLoadError error={error} />;
  }

  const ipFamilies = data?.ipFamilies || [];

  return (
    <>
      <Typography variant='body1' color='secondary' component='p' sx={{ mb: 2 }}>
        {translate('Description.IpFamilies2')}
      </Typography>
      {ipFamilies.length === 0 ? (
        <EmptyStateBorder>
          <EmptyState
            title={translate('Heading.CreateFirstIPFamily')}
            size='large'
            description={translate('Description.NoIp')}>
            <Button
              component={Link}
              href={IP_FAMILY_CREATE_HREF}
              color='primaryBrand'
              variant='contained'>
              {translate('Button.CreateIpFamily')}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      ) : (
        <Fragment>
          <Button
            component={Link}
            href={IP_FAMILY_CREATE_HREF}
            color='primaryBrand'
            variant='contained'
            sx={{ mt: 3, mb: 3 }}>
            {translate('Button.CreateIpFamily')}
          </Button>
          <IpFamiliesTable ipFamilies={ipFamilies} />
          <Pagination {...paginationProps} />
        </Fragment>
      )}
    </>
  );
};

export default withTranslation(IpFamiliesContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);

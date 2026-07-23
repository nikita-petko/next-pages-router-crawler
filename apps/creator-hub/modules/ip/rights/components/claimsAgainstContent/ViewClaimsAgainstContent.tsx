import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import type { ClaimItem } from '@rbx/client-rights/v1';
import { ClaimItemStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d } from '@rbx/thumbnails';
import {
  Typography,
  Grid,
  Breadcrumbs,
  Link as UILink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TableFooter,
  TablePagination,
  Button,
} from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { PageLoading } from '@modules/miscellaneous/components';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { useIpLayoutContext } from '../../../IpAppNavigationLayout';
import contentTypeToClaimContentType from '../../helpers/getClaimContentType';
import contentTypeToThumbnailType from '../../helpers/getThumbnailType';
import useClaimItemsByContent from '../../hooks/useClaimItemsByContent';
import useContentDetails from '../../hooks/useContentDetails';
import usePagination from '../../hooks/usePagination';
import { RIGHTS_MANAGEMENT_HREF } from '../../urls';
import useClaimItemDetailStyles from '../claimItem/useClaimItemDetailStyles';
import RightsApiErrorView from '../error/RightsApiErrorView';
import AccountHeader from '../removalRequests/AccountHeader';
import AcceptAllForm from './AcceptAllForm';
import ContentRow from './ContentRow';

// ViewClaimsAgainstContent shows all claims items filed against my content, impact, and actions
const ViewClaimsAgainstContent = () => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const {
    isFetched: isIXPFetched,
    params: { enableClaimsAgainstMe },
  } = useIXPParameters(IXPLayers.RightsManager);

  const {
    classes: { image, contentContainer, impactSection },
  } = useClaimItemDetailStyles();

  const { account } = useCurrentAccountContext();
  const contentId = (router.query.contentId as string) ?? '';
  const contentType = (router.query.contentType as string) ?? '';
  const claimContentType = contentTypeToClaimContentType(contentType);
  const {
    contentDetails,
    isPending: contentLoading,
    error: contentError,
  } = useContentDetails(Number(contentId), claimContentType);
  const {
    claimItems,
    invalidate: invalidateQuery,
    isPending: claimItemsLoading,
    error: claimItemsError,
  } = useClaimItemsByContent(account?.id, contentType, contentId);
  const pendingClaimItems = claimItems.filter(
    (claimItem) => claimItem.status === ClaimItemStatusEnum.Pending,
  );

  const { page, rowsPerPage, setRowsPerPage, setPage } = usePagination({ initialRowsPerPage: 5 });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const currentPageClaimItems = claimItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isImpacted = useMemo(
    () =>
      claimItems.some(
        (claimItem) =>
          claimItem.status === ClaimItemStatusEnum.Pending ||
          claimItem.status === ClaimItemStatusEnum.Accept,
      ),
    [claimItems],
  );

  const [selectedClaims, setSelectedClaims] = useState<ClaimItem[]>([]);
  const [isAcceptAllFormOpen, setIsAcceptAllFormOpen] = useState(false);

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    setPageTitle(
      <Breadcrumbs maxItems={3} separator='/'>
        <Typography>
          <Link href={RIGHTS_MANAGEMENT_HREF} passHref legacyBehavior>
            <UILink color='inherit'>{translate('Label.ClaimsAgainstMe')}</UILink>
          </Link>
        </Typography>
        {!contentError && (
          <Typography variant='largeLabel1' color='primary'>
            {contentDetails?.contentName}
          </Typography>
        )}
        {!!contentError && (
          <Typography variant='largeLabel1' color='primary'>
            {translate('Label.ID')}: {contentId}
          </Typography>
        )}
      </Breadcrumbs>,
    );
  }, [contentDetails?.contentName, contentError, contentId, setPageTitle, translate]);

  if (!isIXPFetched) {
    return null;
  }

  if (!enableClaimsAgainstMe) {
    return null;
  }

  if (!account || !ready || contentLoading || claimItemsLoading) {
    return <PageLoading />;
  }

  if (contentError || claimItemsError || claimItems.length === 0) {
    return (
      <RightsApiErrorView
        errorResponse={contentError || claimItemsError}
        handleReload={() => router.reload()}
      />
    );
  }
  return (
    <Grid container direction='column' spacing={3}>
      <AccountHeader account={account} />
      <Grid item container direction='column' spacing={1} sx={{ marginTop: '0px' }}>
        <Grid item container spacing={1}>
          <Grid item XSmall>
            {!contentError && <Typography variant='h1'>{contentDetails?.contentName}</Typography>}
            {!!contentError && (
              <Typography variant='h1'>
                {translate('Label.ID')}: {contentId}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid XSmall columnSpacing={4} container item>
        <Grid item XSmall={3} container className={contentContainer}>
          <Thumbnail2d
            imgClassName={image}
            targetId={Number(contentId)}
            skeletonVariant='square'
            type={contentTypeToThumbnailType(claimContentType)}
            alt={translate('Label.ContentPreview')}
            containerClass={contentContainer}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground
          />
        </Grid>
        <Grid item XSmall={9} container columnGap={3}>
          <Grid item XSmall={12}>
            <Typography variant='h1'>{translate('Heading.Impact')}</Typography>
          </Grid>
          <Grid item container XSmall className={impactSection} rowGap={2}>
            <Grid item XSmall={12}>
              <Typography variant='body1' color='secondary'>
                {translate('Description.Monetization')}
              </Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Typography variant='h5'>
                {isImpacted ? translate('Description.Offsale') : translate('Description.OnSale')}
              </Typography>
            </Grid>
          </Grid>
          <Grid item container XSmall className={impactSection} rowGap={2}>
            <Grid item XSmall={12}>
              <Typography variant='body1' color='secondary'>
                {translate('Description.Discoverability')}
              </Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Typography variant='h5'>
                {isImpacted
                  ? translate('Description.NotDiscoverable')
                  : translate('Description.Discoverable')}
              </Typography>
            </Grid>
          </Grid>
          <Grid item container XSmall className={impactSection} rowGap={2}>
            <Grid item XSmall={12}>
              <Typography variant='body1' color='secondary'>
                {translate('Description.Usability')}
              </Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Typography variant='h5'>
                {contentDetails?.isDevMarketplace
                  ? translate('Description.Visible')
                  : translate('Description.Wearable')}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item XSmall />
      <Grid item container>
        <Button
          variant='contained'
          color='secondary'
          onClick={() => setIsAcceptAllFormOpen(true)}
          disabled={selectedClaims.length === 0}>
          {translate('Label.AcceptClaims')}
        </Button>
      </Grid>
      <AcceptAllForm
        open={isAcceptAllFormOpen}
        setOpen={setIsAcceptAllFormOpen}
        claimItems={selectedClaims}
        invalidateClaimitems={invalidateQuery}
      />
      <Grid item container direction='column' spacing={3}>
        <Grid item>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width='10px'>
                  <Checkbox
                    color='secondary'
                    indeterminate={
                      selectedClaims.length > 0 && selectedClaims.length < pendingClaimItems.length
                    }
                    checked={
                      pendingClaimItems.length > 0 &&
                      selectedClaims.length === pendingClaimItems.length
                    }
                    disabled={pendingClaimItems.length === 0}
                    onChange={(_, checked) => setSelectedClaims(checked ? pendingClaimItems : [])}
                  />
                </TableCell>
                <TableCell>{translate('Label.ClaimantsCreation')}</TableCell>
                <TableCell>{translate('Label.Claimant')}</TableCell>
                <TableCell>{translate('Label.Status')}</TableCell>
                <TableCell>{translate('Label.DueDate')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageClaimItems.map((claimItem) => (
                <ContentRow
                  claimItem={claimItem}
                  key={claimItem.id}
                  selectedClaims={selectedClaims}
                  setSelectedClaims={setSelectedClaims}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  count={claimItems.length || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(ViewClaimsAgainstContent, [TranslationNamespace.RightsPortal]);

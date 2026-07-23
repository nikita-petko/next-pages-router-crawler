import Link from 'next/link';
import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AffiliateLink,
  CreateAffiliateLinkResponseAffiliateLink,
} from '@rbx/client-affiliate-links-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Button, useSnackbar, LinearProgress, makeStyles } from '@rbx/ui';
import AffiliateProgramBanner from '@modules/affiliate-program/components/AffiliateProgramBanner';
import universesClient from '@modules/clients/universes';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useGetAffiliateLinks } from '@modules/react-query/affiliateLinks';
import ShareLinkDialog from './ShareLinkDialog';
import ShareLinkEmptyState from './ShareLinkEmptyState';
import ShareLinkTable from './ShareLinkTable';

const useStyles = makeStyles()(() => {
  return {
    loading: {
      width: '50%',
    },
  };
});

const ShareLinkContainer: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const group = useCurrentGroup();
  const {
    classes: { loading },
  } = useStyles();
  const { query } = useRouter();
  const analyticsUrl = `/dashboard/analytics?tab=ShareLinks${query.groupId ? `&groupId=${query.groupId}` : ''}`;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageTokens, setPageTokens] = useState<[undefined, ...string[]]>([undefined]);
  const [existingAffiliateLink, setExistingAffiliateLink] = useState<AffiliateLink | undefined>(
    undefined,
  );
  const [createdAffiliateLink, setCreatedAffiliateLink] =
    useState<CreateAffiliateLinkResponseAffiliateLink>();
  const { data, refetch, error, isPending } = useGetAffiliateLinks({
    maxPageSize: rowsPerPage,
    pageToken: pageTokens[currentPage],
    groupId: group?.id,
  });

  useEffect(() => {
    if (currentPage === 0) {
      if (data?.nextPageToken) {
        setPageTokens([undefined, data.nextPageToken]);
      } else {
        setPageTokens([undefined]);
      }
    }
  }, [currentPage, data?.nextPageToken]);

  const count = useMemo(() => {
    const current = data?.totalCount ?? 0;
    const nextPageMax = (currentPage + 1) * rowsPerPage;
    if (data?.nextPageToken && nextPageMax > current) {
      return nextPageMax;
    }
    return current;
  }, [currentPage, data?.nextPageToken, data?.totalCount, rowsPerPage]);

  useEffect(() => {
    const nextPageToken = data?.nextPageToken;
    if (typeof nextPageToken === 'string') {
      setPageTokens((prevPageTokens) => [...prevPageTokens, nextPageToken]);
    }
  }, [data?.nextPageToken]);

  const shareLinks = data?.affiliateLinks;
  const hasShareLinks = shareLinks && shareLinks.length > 0;

  const getUniverseId = useCallback(async (placeId: number) => {
    try {
      const results = await universesClient.getUniverseContainingPlace(placeId);
      return results?.universeId ?? null;
    } catch {
      return null;
    }
  }, []);

  const copyLink = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url);
      enqueue({
        message: translate('Label.CopiedToClipboard'),
        autoHide: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      });
    },
    [enqueue, translate],
  );

  const editLink = useCallback((affiliateLink: AffiliateLink) => {
    setCreatedAffiliateLink(undefined);
    setExistingAffiliateLink(affiliateLink);
    setCreateDialogOpen(true);
  }, []);

  const onCreateLink = useCallback(() => {
    setCreatedAffiliateLink(undefined);
    setExistingAffiliateLink(undefined);
    setCreateDialogOpen(true);
  }, []);

  const onPageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNumber: number) => {
      setCurrentPage(pageNumber);
    },
    [],
  );

  const onRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setCurrentPage(0);
      setPageTokens([undefined]);
    },
    [],
  );

  const onCreateOrUpdateLink = useCallback(() => {
    setCurrentPage(0);
    setPageTokens([undefined]);
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <Grid>
        <LoadError onReload={refetch} />
      </Grid>
    );
  }

  if (isPending) {
    return (
      <Grid container flex='1' justifyContent='center' alignItems='center'>
        <LinearProgress title='loading' classes={{ root: loading }} />
      </Grid>
    );
  }

  return (
    <Grid container gap='24px' direction='column'>
      <AffiliateProgramBanner />

      {hasShareLinks ? (
        <Grid container gap='32px'>
          <Grid container gap='12px'>
            <Button onClick={onCreateLink} variant='contained' size='large'>
              {translate('Action.CreateLink')}
            </Button>
            <Button
              variant='contained'
              color='secondary'
              size='large'
              component={Link}
              href={analyticsUrl}>
              {translate('Action.ViewAnalytics')}
            </Button>
          </Grid>
          <ShareLinkTable
            copyLink={copyLink}
            editLink={editLink}
            count={count}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            shareLinks={shareLinks}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </Grid>
      ) : (
        <ShareLinkEmptyState showPayoutAlert openCreateLink={onCreateLink} />
      )}
      <ShareLinkDialog
        copyLink={copyLink}
        isOpen={createDialogOpen}
        close={() => setCreateDialogOpen(false)}
        onCreateOrUpdateLink={onCreateOrUpdateLink}
        getUniverseId={getUniverseId}
        existingAffiliateLink={existingAffiliateLink}
        createdAffiliateLink={createdAffiliateLink}
        setCreatedAffiliateLink={setCreatedAffiliateLink}
      />
    </Grid>
  );
};

export default withTranslation(ShareLinkContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.ShareLinksManagement,
]);

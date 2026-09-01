import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { ClaimContentContentTypeEnum, ClaimItemStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { makeStyles, TableCell, TableRow } from '@rbx/ui';
import type { ClaimItemOverride } from '@modules/clients/rights';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useContentDetails from '../../hooks/useContentDetails';
import { CLAIMS_AGAINST_CONTENT_HREF } from '../../urls';
import ContentGrid from '../common/ContentGrid';
import ClaimGroupStatus from './ClaimGroupStatus';

const useStyles = makeStyles()((theme) => ({
  claimDescription: {
    width: '21%',
  },
  statusColumn: {
    width: '16%',
  },
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.actionV2.secondary.containedHoverFocus,
      color: theme.palette.actionV2.primary.containedHoverFocus,
    },
  },
}));

// ClaimAgainstMeRow is a table row that displays a Group of C&D Claims.
const ClaimAgainstMeRow = ({ claimItems }: { claimItems: ClaimItemOverride[] }) => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const {
    classes: { claimDescription, statusColumn, tableRow },
  } = useStyles();
  const representativeClaimItem = claimItems[0];
  const representativeContent = representativeClaimItem?.contents?.[0];
  const contentId = parseInt(representativeContent?.content_id ?? '-1', 10);
  const contentType = representativeContent?.content_type || ClaimContentContentTypeEnum.External;
  const isImpacted = useMemo(
    () =>
      claimItems.some(
        (claimItem) =>
          claimItem.status === ClaimItemStatusEnum.Pending ||
          claimItem.status === ClaimItemStatusEnum.Accept,
      ),
    [claimItems],
  );
  const {
    contentDetails,
    isPending: contentLoading,
    error: contentError,
  } = useContentDetails(contentId, contentType);
  const numPending = useMemo(
    () => claimItems.filter((claimItem) => claimItem.status === ClaimItemStatusEnum.Pending).length,
    [claimItems],
  );

  if (!ready || contentLoading || contentError) {
    return null;
  }

  const respondURL = CLAIMS_AGAINST_CONTENT_HREF(contentType, contentId.toString());

  return (
    <TableRow
      key={representativeClaimItem.id ?? ''}
      className={tableRow}
      onClick={() => router.push(respondURL)}>
      <TableCell className={claimDescription}>
        <ContentGrid
          contentId={contentId}
          contentType={contentType}
          originalLink={representativeContent?.url}
          sourceOfCreation={representativeClaimItem.source}
          showCreatorName={false}
        />
      </TableCell>
      <TableCell className={statusColumn}>
        <ClaimGroupStatus numPending={numPending} />
      </TableCell>
      <TableCell>
        {contentDetails?.isDevMarketplace
          ? translate('Description.Visible')
          : translate('Description.Wearable')}
      </TableCell>
      <TableCell>
        {isImpacted ? translate('Description.Offsale') : translate('Description.OnSale')}
      </TableCell>
      <TableCell>
        {isImpacted
          ? translate('Description.NotDiscoverable')
          : translate('Description.Discoverable')}
      </TableCell>
    </TableRow>
  );
};

export default withTranslation(ClaimAgainstMeRow, [TranslationNamespace.RightsPortal]);

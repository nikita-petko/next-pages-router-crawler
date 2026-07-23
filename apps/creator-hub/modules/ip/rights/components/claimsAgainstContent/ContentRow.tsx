import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ClaimItem,
  ClaimContentContentTypeEnum,
  ClaimItemStatusEnum,
  ClaimItemSourceEnum,
} from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, TableCell, TableRow, Checkbox, Link as UILink } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import Link from 'next/link';
import { PageLoading } from '@modules/miscellaneous/common';
import useContentDetails from '../../hooks/useContentDetails';
import useClaimItemDetailStyles from '../claimItem/useClaimItemDetailStyles';
import { ClaimPages, ViewClaimItemURL } from '../claimItem/ViewClaimItemContainer';
import RightsApiErrorView from '../error/RightsApiErrorView';
import ContentGrid from '../common/ContentGrid';
import StatusRow from './StatusRow';

interface ContentRowProps {
  claimItem: ClaimItem;
  selectedClaims: ClaimItem[];
  setSelectedClaims: (claimItems: ClaimItem[]) => void;
}

// ContentRow displays information about a specific claim against an asset.
const ContentRow: FunctionComponent<ContentRowProps> = ({
  claimItem,
  selectedClaims,
  setSelectedClaims,
}) => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const {
    classes: { selectedRow, tableRow },
  } = useClaimItemDetailStyles();
  const contentId = parseInt(claimItem?.content?.contentId ?? '-1', 10);
  const contentType = claimItem?.content?.contentType || ClaimContentContentTypeEnum.External;

  const {
    contentDetails,
    isPending: contentLoading,
    error: contentError,
  } = useContentDetails(contentId, contentType);

  let creatorLink = '';
  let creatorName = '';
  const isExternal = claimItem?.source !== ClaimItemSourceEnum.OnRoblox;
  if (isExternal) {
    if (claimItem.account?.ownerType === 'RobloxGroup') {
      creatorLink = getGroupUrl(Number(claimItem.account?.ownerId));
      creatorName = translate('Message.ClaimantGroup');
    } else {
      creatorLink = getUserUrl(Number(claimItem.account?.ownerId));
      creatorName = translate('Message.ClaimantCreator');
    }
  } else {
    creatorLink = getUserUrl(Number(contentDetails.creatorId));
    creatorName = `@${contentDetails.creatorName}`;
  }

  const contentURL = claimItem?.content?.url ?? '';

  const isSelected = selectedClaims.includes(claimItem);

  const handleClaimItemRouter = () => {
    if (claimItem.claimId && claimItem.id) {
      router.push({
        pathname: ViewClaimItemURL(claimItem.claimId, claimItem.id),
        query: { claim: ClaimPages.AgainstMe },
      });
    }
  };

  const checkRow = (checked: boolean) =>
    checked
      ? setSelectedClaims([...selectedClaims, claimItem])
      : setSelectedClaims(selectedClaims.filter((claim) => claim !== claimItem));
  if (!ready || contentLoading) {
    return <PageLoading />;
  }

  if (contentError) {
    return <RightsApiErrorView errorResponse={contentError} handleReload={() => router.reload()} />;
  }

  const statusExpireAt = claimItem.statusExpireAt?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dueDate =
    claimItem.status === ClaimItemStatusEnum.Pending ||
    claimItem.status === ClaimItemStatusEnum.Dispute
      ? statusExpireAt
      : translate('Label.NotApplicable');

  return (
    <TableRow
      key={claimItem.id}
      className={`${isSelected ? selectedRow : ''} ${tableRow}`}
      hover={!isSelected}
      onClick={handleClaimItemRouter}>
      <TableCell onClick={(event) => event.stopPropagation()}>
        <Checkbox
          color='secondary'
          checked={selectedClaims.includes(claimItem)}
          onChange={(_, checked) => checkRow(checked)}
          disabled={claimItem.status !== ClaimItemStatusEnum.Pending}
        />
      </TableCell>
      <TableCell>
        <ContentGrid
          contentId={contentId}
          contentType={contentType}
          originalLink={contentURL}
          sourceOfCreation={claimItem.source}
          showCreatorName={false}
        />
      </TableCell>
      <TableCell>
        <Typography noWrap variant='body2' onClick={(event) => event.stopPropagation()}>
          <Link href={creatorLink} passHref legacyBehavior>
            <UILink color='inherit' target='_blank'>
              {creatorName}
            </UILink>
          </Link>
        </Typography>
      </TableCell>
      <TableCell>
        <StatusRow claimItem={claimItem} isAllegedInfringer />
      </TableCell>
      <TableCell>
        <Typography noWrap variant='body2'>
          {dueDate}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
export default withTranslation(ContentRow, [TranslationNamespace.RightsPortal]);

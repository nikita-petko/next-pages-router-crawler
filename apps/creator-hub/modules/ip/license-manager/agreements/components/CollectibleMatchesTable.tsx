import React, { useMemo, useState } from 'react';
import type {
  AgreementCandidateResponse,
  IndexedAgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { ItemTargetType } from '@rbx/client-marketplace-items-api/v1';
import { useFlag } from '@rbx/flags';
import { Locale, useLocalization, useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import {
  AssetThumbnailSize,
  BundleThumbnailSize,
  Thumbnail2d,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import {
  Button,
  RobuxIcon,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@rbx/ui';
import { isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import CellError from '../../../components/error/CellError';
import IpTableRow from '../../../components/IpTableRow';
import useCollectibleMatchItemDetails, {
  type CollectibleMatchItemDetails,
} from '../hooks/useCollectibleMatchItemDetails';
import type { UseMatchesQueryResult } from '../hooks/useMatchesQuery';
import getCollectibleItemTypeLabel from './getCollectibleItemTypeLabel';
import {
  AgreementStatusFromBatchMaps,
  MatchStatusLabel,
  type AgreementStatusesColumnProps,
} from './IphMatchStatusLabel';

const ITEM_COLUMN_MIN_WIDTH_CLASS = '[min-width:184px]';
const COLLECTIBLE_MATCHES_TABLE_COLUMN_COUNT = 6;

type CollectibleMatchCandidate = AgreementCandidateResponse &
  Pick<IndexedAgreementCandidateResponse, 'ipFamilyName'>;

interface CollectibleMatchRowProps {
  match: CollectibleMatchCandidate;
  details: CollectibleMatchItemDetails;
  agreementStatusesColumn?: AgreementStatusesColumnProps;
  isSelected: boolean;
  onActivate: () => void;
}

const CollectibleMatchRow = ({
  match,
  details,
  agreementStatusesColumn,
  isSelected,
  onActivate,
}: CollectibleMatchRowProps) => {
  const { locale } = useLocalization();
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const { collectible } = details;
  const isBundle = collectible.itemTargetType === ItemTargetType.NUMBER_2;
  let priceContent: React.ReactNode;
  if (collectible.price == null) {
    priceContent = translate('Label.Unknown');
  } else if (collectible.price === 0) {
    priceContent = translateCreations('Label.Free');
  } else {
    priceContent = (
      <div className='flex items-center gap-xsmall'>
        <RobuxIcon fontSize='small' />
        <span>{String(collectible.price)}</span>
      </div>
    );
  }

  return (
    <IpTableRow onActivate={onActivate} isSelected={isSelected} aria-selected={isSelected}>
      <TableCell className={ITEM_COLUMN_MIN_WIDTH_CLASS}>
        <div className='flex items-center gap-small'>
          <Thumbnail2d
            alt={collectible.name ?? ''}
            targetId={collectible.itemTargetId ?? 0}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={isBundle ? BundleThumbnailSize._150x150 : AssetThumbnailSize._50x50}
            skeletonVariant='square'
            containerClass='block height-[42px] width-[42px] shrink-0 padding-none'
            type={isBundle ? ThumbnailTypes.bundleThumbnail : ThumbnailTypes.assetThumbnail}
          />
          <div className='min-width-0'>
            <Typography component='div' variant='body2'>
              {collectible.name ?? translate('Label.Unknown')}
            </Typography>
            <Typography
              variant='caption'
              color='secondary'
              className='[margin-top:4px]'
              component='div'>
              {collectible.creatorName ? `@${collectible.creatorName}` : ''}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {getCollectibleItemTypeLabel(details, translateCreations, tPendingTranslation)}
      </TableCell>
      <TableCell>{match.ipFamilyName ?? translate('Label.Unknown')}</TableCell>
      <TableCell>{priceContent}</TableCell>
      <TableCell>
        {agreementStatusesColumn ? (
          <AgreementStatusFromBatchMaps
            agreementId={match.agreementId}
            column={agreementStatusesColumn}
          />
        ) : (
          <MatchStatusLabel status={undefined} />
        )}
      </TableCell>
      <TableCell>
        {match.discoveredAt
          ? formatDate(match.discoveredAt, locale ?? Locale.English)
          : translate('Label.Unknown')}
      </TableCell>
    </IpTableRow>
  );
};

const CollectibleMatchRowSkeleton = () => {
  return (
    <IpTableRow>
      <TableCell className={ITEM_COLUMN_MIN_WIDTH_CLASS}>
        <div className='flex items-center gap-small'>
          <Skeleton
            variant='square'
            width={42}
            height={42}
            className='block height-[42px] width-[42px] shrink-0 padding-none'
            animate
          />
          <div className='min-width-0'>
            <Skeleton variant='text' animate width={100} />
            <Skeleton variant='text' animate width={80} />
          </div>
        </div>
      </TableCell>
      {Array.from({ length: COLLECTIBLE_MATCHES_TABLE_COLUMN_COUNT - 1 }, (_, index) => (
        // eslint-disable-next-line react/no-array-index-key -- Static table skeleton cells have no identity.
        <TableCell key={index}>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
      ))}
    </IpTableRow>
  );
};

interface CollectibleMatchesTableProps {
  dataReq: Omit<
    Pick<
      UseMatchesQueryResult,
      'allAgreementCandidates' | 'fetchNextPage' | 'hasNextPage' | 'isFetchingNextPage'
    >,
    'allAgreementCandidates'
  > & {
    allAgreementCandidates: CollectibleMatchCandidate[];
  };
  agreementStatusesColumn?: AgreementStatusesColumnProps;
  onLoadMore?: () => void;
}

/**
 * Renders Collectible matches. The sibling MatchesTable's legacy generic name currently refers to
 * the Experience-only table and will eventually be renamed to ExperienceMatchesTable.
 */
const CollectibleMatchesTable = ({
  dataReq,
  agreementStatusesColumn,
  onLoadMore,
}: CollectibleMatchesTableProps) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const isCollectibleMatchesEnabled =
    isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled;
  const [selectedMatchId, setSelectedMatchId] = useState<string>();
  const itemLabel = tPendingTranslation(
    'Item',
    'Column header text to designate items like avatar items, bundles, or other assets',
    translationKey('Label.Item', TranslationNamespace.AgreementsManager),
  );
  const { allAgreementCandidates, fetchNextPage, hasNextPage, isFetchingNextPage } = dataReq;
  const collectibleItemIds = useMemo(
    () => [
      ...new Set(
        allAgreementCandidates
          .map((candidate) => candidate.candidateId)
          .filter((candidateId): candidateId is string => Boolean(candidateId)),
      ),
    ],
    [allAgreementCandidates],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(
    isCollectibleMatchesEnabled ? collectibleItemIds : [],
  );

  if (!isCollectibleMatchesEnabled) {
    return null;
  }

  let rows: React.ReactNode;
  if (collectibleItemIds.length > 0 && itemDetailsQuery.isPending) {
    rows = allAgreementCandidates.map((match) => <CollectibleMatchRowSkeleton key={match.id} />);
  } else if (itemDetailsQuery.error) {
    rows = (
      <IpTableRow>
        <TableCell colSpan={COLLECTIBLE_MATCHES_TABLE_COLUMN_COUNT}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  } else {
    rows = allAgreementCandidates.map((match) => {
      const details = match.candidateId ? itemDetailsQuery.data?.[match.candidateId] : undefined;
      if (!details) {
        return (
          <IpTableRow key={match.id}>
            <TableCell colSpan={COLLECTIBLE_MATCHES_TABLE_COLUMN_COUNT}>
              <CellError />
            </TableCell>
          </IpTableRow>
        );
      }
      return (
        <CollectibleMatchRow
          key={match.id}
          match={match}
          details={details}
          agreementStatusesColumn={agreementStatusesColumn}
          isSelected={match.id != null && match.id === selectedMatchId}
          onActivate={() => {
            setSelectedMatchId(match.id ?? undefined);
            // TODO(MUS-2656): Add the Collectible match row action once its details experience is defined.
          }}
        />
      );
    });
  }

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={ITEM_COLUMN_MIN_WIDTH_CLASS}>{itemLabel}</TableCell>
              <TableCell>{translate('Label.Type')}</TableCell>
              <TableCell>{translate('Label.IpFamily')}</TableCell>
              <TableCell>{translateCreations('Label.Price')}</TableCell>
              <TableCell>{translate('Label.Status')}</TableCell>
              <TableCell>{translate('Label.DateMatched')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>

      {hasNextPage && (
        <div className='padding-large text-align-x-center'>
          <Button
            onClick={() => {
              onLoadMore?.();
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            variant='outlined'
            color='secondary'>
            {isFetchingNextPage ? translate('Label.Loading') : translate('Action.LoadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollectibleMatchesTable;

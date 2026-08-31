import React, { useMemo } from 'react';
import type {
  AgreementCandidateResponse,
  IndexedAgreementCandidateResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Locale, useLocalization, useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import { Thumbnail2d } from '@rbx/thumbnails';
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
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';
import getCollectibleItemTypeLabel from './getCollectibleItemTypeLabel';
import {
  AgreementStatusFromBatchMaps,
  MatchStatusLabel,
  type AgreementStatusesColumnProps,
} from './IphMatchStatusLabel';

const ITEM_COLUMN_MIN_WIDTH_CLASS = '[min-width:184px]';
const COLLECTIBLE_MATCHES_TABLE_COLUMN_COUNT = 6;

export type CollectibleMatchCandidate = AgreementCandidateResponse &
  Pick<IndexedAgreementCandidateResponse, 'ipFamilyName' | 'candidateContentCreatorType'>;

export type CollectibleMatchesDataReq = Omit<
  Pick<
    UseMatchesQueryResult,
    'allAgreementCandidates' | 'fetchNextPage' | 'hasNextPage' | 'isFetchingNextPage'
  >,
  'allAgreementCandidates'
> & {
  allAgreementCandidates: CollectibleMatchCandidate[];
};

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
  const presentation = getCollectibleMatchPresentation(
    details,
    match.candidateContentCreatorType ?? undefined,
  );
  let priceContent: React.ReactNode;
  if (presentation.price == null) {
    priceContent = translate('Label.Unknown');
  } else if (presentation.price === 0) {
    priceContent = translateCreations('Label.Free');
  } else {
    priceContent = (
      <div className='flex items-center gap-xsmall'>
        <RobuxIcon fontSize='small' />
        <span>{String(presentation.price)}</span>
      </div>
    );
  }

  return (
    <IpTableRow onActivate={onActivate} isSelected={isSelected} aria-selected={isSelected}>
      <TableCell className={ITEM_COLUMN_MIN_WIDTH_CLASS}>
        <div className='flex items-center gap-small'>
          <Thumbnail2d
            alt={presentation.thumbnailAlt}
            targetId={presentation.thumbnailTargetId}
            size={presentation.size}
            skeletonVariant='square'
            containerClass='block height-[42px] width-[42px] shrink-0 padding-none'
            type={presentation.type}
          />
          <div className='min-width-0'>
            <Typography component='div' variant='body2'>
              {presentation.name ?? translate('Label.Unknown')}
            </Typography>
            <Typography
              variant='caption'
              color='secondary'
              className='[margin-top:4px]'
              component='div'>
              {presentation.creatorDisplayName}
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
  dataReq: CollectibleMatchesDataReq;
  agreementStatusesColumn?: AgreementStatusesColumnProps;
  onLoadMore?: () => void;
  onSelectMatch: (match: CollectibleMatchCandidate) => void;
  selectedMatchId?: string;
}

/**
 * Renders Collectible matches. Universe matches are rendered by UniverseMatchesTable.
 */
const CollectibleMatchesTable = ({
  dataReq,
  agreementStatusesColumn,
  onLoadMore,
  onSelectMatch,
  selectedMatchId,
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
          onActivate={() => onSelectMatch(match)}
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

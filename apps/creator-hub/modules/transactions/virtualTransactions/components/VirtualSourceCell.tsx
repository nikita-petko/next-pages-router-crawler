import type { FunctionComponent } from 'react';
import React from 'react';
import { Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TransactionEntity } from '@modules/clients/transactionRecords';
import { TransactionEntityType } from '@modules/clients/transactionRecords';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';
import { toCanonicalId } from '@modules/react-query/transactionRecords/transactionRecordsQueries';
import EntityThumbnail from './EntityThumbnail';

// User 1 is the "Roblox" account; its headshot is the default avatar for a missing counterparty.
const ROBLOX_USER_ID = 1;

export type VirtualSourceCellProps = {
  counterParty?: TransactionEntity | null;
  // Display name resolved (and batched) by the table; falls back to a generic label when unavailable.
  name?: string;
};

// The counterParty comes back as only { type, id }. The table resolves display names in a single
// batched request and passes the result here, so the Source column shows a user/group name
// (linked to their profile) instead of a raw id — without a lookup per row.
const VirtualSourceCell: FunctionComponent<React.PropsWithChildren<VirtualSourceCellProps>> = ({
  counterParty,
  name,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  // Reuse the resolver's canonical id validation (positive safe integer) and link only User/Group.
  const id = toCanonicalId(counterParty?.id);

  // The batched lookup leaves `name` undefined both while it loads and if it fails. For a user we
  // fall back to a neutral label; for a group we render nothing rather than mislabel it with a
  // person label like "Roblox User" (which links to a group page). Raw ids are never shown.
  const userFallbackLabel = translate(
    translationKey('Label.RobloxUser', TranslationNamespace.Transactions),
  );
  const linkedFallbackLabel =
    counterParty?.type === TransactionEntityType.Group ? '' : userFallbackLabel;

  let thumbnailType: ThumbnailTypes | undefined;
  let href: string | undefined;
  let radiusClass = 'radius-circle';
  if (id !== null && counterParty?.type === TransactionEntityType.Group) {
    thumbnailType = ThumbnailTypes.groupIcon;
    href = www.getGroupUrl(id);
    radiusClass = 'radius-small';
  } else if (id !== null && counterParty?.type === TransactionEntityType.User) {
    thumbnailType = ThumbnailTypes.avatarHeadshot;
    href = www.getUserUrl(id);
  }

  // Missing/unresolvable counterparty (transactions from before user data was backfilled have no
  // counterparty): show a default avatar + generic "Roblox User" rather than a blank cell.
  if (id === null || thumbnailType === undefined || href === undefined) {
    return (
      <span className='flex items-center gap-small min-width-0'>
        <EntityThumbnail
          targetId={ROBLOX_USER_ID}
          thumbnailType={ThumbnailTypes.avatarHeadshot}
          radiusClass='radius-circle'
        />
        <span className='text-body-medium content-default text-truncate-end min-width-0'>
          {name ?? userFallbackLabel}
        </span>
      </span>
    );
  }

  return (
    <span className='flex items-center gap-small min-width-0'>
      <EntityThumbnail
        key={`${thumbnailType}-${id}`}
        targetId={id}
        thumbnailType={thumbnailType}
        radiusClass={radiusClass}
      />
      <Link
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        isExternal={false}
        color='Standard'
        underline='none'
        className='text-body-medium content-default text-truncate-end min-width-0'>
        {name ?? linkedFallbackLabel}
      </Link>
    </span>
  );
};

export default VirtualSourceCell;

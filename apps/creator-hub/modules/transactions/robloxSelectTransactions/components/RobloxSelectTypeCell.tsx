import type { FunctionComponent } from 'react';
import React from 'react';
import { Skeleton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useCoreContentTransactionMetadata } from '@modules/audience-reach/hooks/useCoreContentTransactionMetadata';
import type { TransactionRecord } from '@modules/clients/transactionRecords';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import VirtualProductItem from '../../virtualTransactions/components/VirtualProductItem';
import {
  getRobloxSelectProductMedia,
  parseRobloxSelectDetails,
} from '../utils/parseRobloxSelectDetails';

export type RobloxSelectTypeCellProps = {
  record: TransactionRecord;
};

// Rows charged before the current expedited fee took effect still need the right label, so match
// the historical amounts too until we can label off the transaction itself.
const KnownExpeditedReviewFees = [100_000, 50_000];

// Type column for Roblox Select fee rows: fee label by amount + experience thumbnail/name from
// v1 details.place (same VirtualProductItem layout as Virtual item sales).
const RobloxSelectTypeCell: FunctionComponent<
  React.PropsWithChildren<RobloxSelectTypeCellProps>
> = ({ record }) => {
  const { translate, translateWithNamespace } = useTranslationWrapper(useTranslation());
  const { data: metadata, isLoading: isMetadataLoading } = useCoreContentTransactionMetadata();

  // The fee labels are keyed off the metadata amounts, so hold the cell until they resolve rather
  // than flashing Unknown on every Select row.
  if (isMetadataLoading) {
    return <Skeleton variant='Text' height={16} width='12em' />;
  }

  const amount = Math.abs(Number(record.amount));

  let typeLabel;
  if (amount === metadata?.publishingFee) {
    typeLabel = translateWithNamespace(
      TranslationNamespace.Transactions,
      'Label.RefundablePublishingFee',
    );
  } else if (amount === metadata?.expeditedReviewFee || KnownExpeditedReviewFees.includes(amount)) {
    typeLabel = translateWithNamespace(
      TranslationNamespace.Transactions,
      'Label.ExpeditedReviewFee',
    );
  } else {
    typeLabel = translate(translationKey('Label.Unknown', TranslationNamespace.Transactions));
  }

  const selectDetails = parseRobloxSelectDetails(record.details);
  // details.name is usually "Roblox Select for {place.name}"; prefer the place name so the fee
  // label isn't repeated in the product line.
  const placeName = selectDetails.place?.name?.trim();
  // Empty place names should fall through to details.name (?? alone would keep "").
  const experienceName =
    placeName === undefined || placeName === '' ? selectDetails.name?.trim() : placeName;
  if (!experienceName) {
    return <span className='text-body-medium content-default'>{typeLabel}</span>;
  }

  const media = getRobloxSelectProductMedia(selectDetails);

  return (
    <VirtualProductItem
      header={typeLabel}
      name={experienceName}
      targetId={media.targetId}
      thumbnailType={media.thumbnailType}
      href={media.href}
    />
  );
};

export default RobloxSelectTypeCell;

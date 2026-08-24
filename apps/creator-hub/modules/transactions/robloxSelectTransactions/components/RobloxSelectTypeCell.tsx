import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  ExpeditedReviewFee,
  PublishingFee,
} from '@modules/audience-reach/constants/audienceReachConstants';
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

// Type column for Roblox Select fee rows: fee label by amount + experience thumbnail/name from
// v1 details.place (same VirtualProductItem layout as Virtual item sales).
const RobloxSelectTypeCell: FunctionComponent<
  React.PropsWithChildren<RobloxSelectTypeCellProps>
> = ({ record }) => {
  const { translate, translateWithNamespace } = useTranslationWrapper(useTranslation());

  let typeLabel;
  switch (Math.abs(Number(record.amount))) {
    case PublishingFee:
      typeLabel = translateWithNamespace(
        TranslationNamespace.Transactions,
        'Label.RefundablePublishingFee',
      );
      break;
    case ExpeditedReviewFee:
      typeLabel = translateWithNamespace(
        TranslationNamespace.Transactions,
        'Label.ExpeditedReviewFee',
      );
      break;
    default:
      typeLabel = translate(translationKey('Label.Unknown', TranslationNamespace.Transactions));
      break;
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

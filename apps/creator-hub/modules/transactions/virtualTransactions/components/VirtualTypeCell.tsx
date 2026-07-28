import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TransactionRecord } from '@modules/clients/transactionRecords';
import { LedgerReason } from '@modules/clients/transactionRecords';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  getVirtualExperienceLink,
  getVirtualProductMedia,
  isPrivateServerProduct,
  parseSaleDetails,
} from '../constants/virtualSaleDetails';
import VirtualProductItem from './VirtualProductItem';

export type VirtualTypeCellProps = {
  record: TransactionRecord;
};

// The Type column shows the kind of transaction plus, for a sale, the sold product (thumbnail +
// name linked to its main-site description page). Product data comes from the record's enriched
// `details` payload.
const VirtualTypeCell: FunctionComponent<React.PropsWithChildren<VirtualTypeCellProps>> = ({
  record,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  // The table only fetches SaleOfGood today (the v2 endpoint requires an allowed ledgerReason), so
  // in practice `reason` is always SaleOfGood. Purchase isn't surfaced yet, so it falls through to
  // the generic Unknown label rather than getting its own copy.
  const reason = record.ledgerReason ?? LedgerReason.Unknown;

  let typeLabel;
  switch (reason) {
    case LedgerReason.SaleOfGood:
      typeLabel = translate(translationKey('Label.ItemSale', TranslationNamespace.Transactions));
      break;
    case LedgerReason.Purchase:
    case LedgerReason.Unknown:
    default:
      typeLabel = translate(translationKey('Label.Unknown', TranslationNamespace.Transactions));
  }

  const details = parseSaleDetails(record.details);
  // Private servers have no per-item name (the payload echoes the experience name), so show a
  // generic "Private Server" label instead and let the experience line below carry the game name.
  const isPrivateServer = isPrivateServerProduct(details);
  const productName = isPrivateServer
    ? translate(translationKey('Label.PrivateServer', TranslationNamespace.Transactions))
    : details.productName;

  // Always show the sold product's name; the thumbnail, link, and experience line are
  // enhancements that may be unavailable for some product types.
  if (reason !== LedgerReason.SaleOfGood || !productName) {
    return <span className='text-body-medium content-default'>{typeLabel}</span>;
  }

  const media = getVirtualProductMedia(details);
  const experience = getVirtualExperienceLink(details);

  return (
    <VirtualProductItem
      header={typeLabel}
      name={productName}
      targetId={media.targetId}
      thumbnailType={media.thumbnailType}
      // The generic "Private Server" label isn't a product page; the experience line carries
      // the link instead.
      href={isPrivateServer ? undefined : media.href}
      experienceName={experience?.name}
      experienceHref={experience?.href}
    />
  );
};

export default VirtualTypeCell;

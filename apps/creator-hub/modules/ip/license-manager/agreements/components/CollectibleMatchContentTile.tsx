import type { FunctionComponent, ReactNode } from 'react';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import { RobuxIcon, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getBundleUrl, getCatalogUrl } from '@modules/miscellaneous/urls/www';
import { ContentTile, ContentType } from '../../components/ContentTile';
import type { CollectibleMatchItemDetails } from '../hooks/useCollectibleMatchItemDetails';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';

interface CollectibleMatchContentTileProps {
  details: CollectibleMatchItemDetails;
  creatorType?: string | number;
  onLinkClick?: () => void;
}

const CollectibleMatchContentTile: FunctionComponent<CollectibleMatchContentTileProps> = ({
  details,
  creatorType,
  onLinkClick,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const presentation = getCollectibleMatchPresentation(details, creatorType);

  let priceContent: ReactNode;
  if (presentation.price == null) {
    priceContent = translate('Label.Unknown');
  } else if (presentation.price === 0) {
    priceContent = translateCreations('Label.Free');
  } else {
    priceContent = (
      <span className='inline-flex items-center gap-xsmall'>
        <RobuxIcon fontSize='small' />
        <span>{String(presentation.price)}</span>
      </span>
    );
  }

  const link =
    presentation.targetId == null
      ? undefined
      : presentation.isBundle
        ? getBundleUrl(presentation.targetId)
        : getCatalogUrl(presentation.targetId);

  return (
    <ContentTile
      header={presentation.name ?? translate('Label.Unknown')}
      subheader={
        presentation.creatorDisplayName
          ? tPendingTranslation(
              'By {creatorName}',
              'Creator attribution shown below a Collectible match name',
              translationKey('Description.ByCreator', TranslationNamespace.AgreementsManager),
              { creatorName: presentation.creatorDisplayName },
            )
          : ''
      }
      thumbnailTargetId={presentation.targetId ?? 0}
      type={presentation.isBundle ? ContentType.Bundle : ContentType.Asset}
      link={link}
      onLinkClick={onLinkClick}
      footer={
        <Typography variant='captionBody' color='primary' component='div'>
          {priceContent}
        </Typography>
      }
    />
  );
};

export default CollectibleMatchContentTile;

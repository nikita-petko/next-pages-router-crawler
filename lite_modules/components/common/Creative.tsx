import { memo } from 'react';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import CreativeAssetImage from '@components/common/CreativeAssetImage';
import { openCreativePreviewDialog } from '@components/common/dialogs/CreativePreviewDialog';

interface CreativeProps {
  alt?: string;
  assetId: number;
  className?: string;
  showPreview?: boolean;
}

const Creative = memo(({ alt, assetId, className, showPreview = false }: CreativeProps) => {
  const {
    classes: { showPreviewButton },
  } = useCreativesStyles();

  const image = <CreativeAssetImage alt={alt} assetId={assetId} className={className} />;

  return showPreview ? (
    <button
      className={showPreviewButton}
      onClick={() => openCreativePreviewDialog(assetId)}
      type='button'>
      {image}
    </button>
  ) : (
    image
  );
});

export default Creative;

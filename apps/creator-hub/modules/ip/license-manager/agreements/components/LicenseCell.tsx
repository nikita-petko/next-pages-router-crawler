import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import { Typography } from '@rbx/ui';
import useSharedAgreementRowStyles from './SharedAgreementRow.styles';

interface LicenseCellProps {
  thumbnailAssetId: number;
  licenseName: string;
}

/**
 * Two column grid with a thumbnail first, and
 * license name in the second column.
 */
const LicenseCell: FunctionComponent<LicenseCellProps> = ({ thumbnailAssetId, licenseName }) => {
  const { translate } = useTranslation();
  const {
    classes: { thumbnailContainer, twoColumnGrid, thumbnailImage, truncateTwoLines },
  } = useSharedAgreementRowStyles();

  return (
    <div className={twoColumnGrid}>
      <Thumbnail2d
        targetId={thumbnailAssetId}
        type={ThumbnailTypes.assetThumbnail}
        containerClass={thumbnailContainer}
        imgClassName={thumbnailImage}
        alt={translate('Label.ListingThumbnail')}
        // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
        size={AssetThumbnailSize._256x144}
      />
      <div>
        <Typography variant='body2' color='primary' className={truncateTwoLines}>
          {licenseName}
        </Typography>
      </div>
    </div>
  );
};

export default LicenseCell;

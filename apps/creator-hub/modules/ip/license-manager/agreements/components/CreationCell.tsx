import { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes, UniverseThumbnailSize } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import useSharedAgreementRowStyles from './SharedAgreementRow.styles';

interface CreationCellProps {
  universeId: number;
  universeName: string;
  creatorName: string;
}

/**
 * Two column grid with creation details (e.g. universe)
 * with a thumbnail first, and the universe name + creator name
 * in the second column.
 */
const CreationCell: FunctionComponent<CreationCellProps> = ({
  universeId,
  universeName,
  creatorName,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { thumbnailContainer, twoColumnGrid, thumbnailImage, truncateSingleLine },
  } = useSharedAgreementRowStyles();

  return (
    <div className={twoColumnGrid}>
      <Thumbnail2d
        targetId={universeId}
        type={ThumbnailTypes.universeThumbnail}
        containerClass={thumbnailContainer}
        imgClassName={thumbnailImage}
        alt={translate('Label.ExperienceThumbnail')}
        // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
        size={UniverseThumbnailSize._256x144}
      />

      <div>
        <Typography variant='body2' color='primary' component='div' className={truncateSingleLine}>
          {universeName}
        </Typography>
        <Typography variant='body2' color='primary' component='div' className={truncateSingleLine}>
          {`@${creatorName}`}
        </Typography>
      </div>
    </div>
  );
};

export default CreationCell;

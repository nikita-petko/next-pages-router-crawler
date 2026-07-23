import { Icon } from '@rbx/foundation-ui';
import { type FC } from 'react';

import SelectableMediaTile from '@components/common/creative/SelectableMediaTile';
import styles from '@components/common/creative/SelectableMediaTile.module.css';
import TileMediaOverflowMenu from '@components/common/creative/TileMediaOverflowMenu';
import { AI_CREATE_HIDE_IMAGE_ICON, AI_CREATE_REPORT_ICON } from '@constants/aiCreatives';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface AiGeneratedImageTileProps {
  imageUrl: string;
  isDisabled?: boolean;
  isSelected: boolean;
  mediaWrapperClassName?: string;
  onHide: (imageUrl: string) => void;
  onReport: (imageUrl: string) => void;
  onToggleSelect: (imageUrl: string) => void;
  showActionsMenu?: boolean;
  tileClassName?: string;
}

const AiGeneratedImageTile: FC<AiGeneratedImageTileProps> = ({
  imageUrl,
  isDisabled = false,
  isSelected,
  mediaWrapperClassName = '',
  onHide,
  onReport,
  onToggleSelect,
  showActionsMenu = true,
  tileClassName = '',
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);

  return (
    <SelectableMediaTile
      ariaLabel={translate('Label.SelectGeneratedImage')}
      ariaPressed={isSelected}
      className={tileClassName}
      disabled={isDisabled}
      isSelected={isSelected}
      mediaWrapperClassName={mediaWrapperClassName}
      onClick={() => onToggleSelect(imageUrl)}
      overflowMenu={
        showActionsMenu ? (
          <TileMediaOverflowMenu
            ariaLabel={translate('Label.GeneratedImageOptions')}
            isDisabled={isDisabled}
            items={[
              {
                leading: <Icon name={AI_CREATE_REPORT_ICON} size='Medium' />,
                onSelect: () => onReport(imageUrl),
                title: translate('Action.Report'),
                value: 'report',
              },
              {
                leading: <Icon name={AI_CREATE_HIDE_IMAGE_ICON} size='Medium' />,
                onSelect: () => onHide(imageUrl),
                title: translate('Action.DontShowThisAgain'),
                value: 'hide',
              },
            ]}
            showOnHover
          />
        ) : undefined
      }
      rootClassName='group'
      selectionStyle='outline'>
      <img
        alt={translate('Label.GeneratedImagePreview')}
        className={styles.coverImage}
        referrerPolicy='no-referrer'
        src={imageUrl}
      />
    </SelectableMediaTile>
  );
};

export default AiGeneratedImageTile;

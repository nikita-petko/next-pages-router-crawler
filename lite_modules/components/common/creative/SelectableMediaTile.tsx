import { type FC, type ReactNode } from 'react';

import styles from '@components/common/creative/SelectableMediaTile.module.css';

type SelectionStyle = 'border' | 'outline';

interface SelectableMediaTileProps {
  ariaLabel: string;
  ariaPressed?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  isSelected?: boolean;
  mediaWrapperClassName?: string;
  onClick?: () => void;
  overflowMenu?: ReactNode;
  rootClassName?: string;
  selectionStyle?: SelectionStyle;
  showHoverOverlay?: boolean;
  tabIndex?: number;
}

const SelectableMediaTile: FC<SelectableMediaTileProps> = ({
  ariaLabel,
  ariaPressed,
  children,
  className = '',
  disabled = false,
  isSelected = false,
  mediaWrapperClassName = '',
  onClick,
  overflowMenu,
  rootClassName = '',
  selectionStyle = 'border',
  showHoverOverlay = false,
  tabIndex,
}) => {
  const buttonClassName = [
    styles.button,
    'width-full relative radius-medium transition-colors',
    selectionStyle === 'outline' && isSelected ? styles.buttonSelectedOutline : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mediaWrapperClassNameResolved = [
    styles.mediaWrapper,
    selectionStyle === 'border' && isSelected ? styles.mediaWrapperSelectedBorder : '',
    mediaWrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.root} ${rootClassName}`.trim()}>
      <div className={styles.mediaSurface}>
        <button
          aria-label={ariaLabel}
          aria-pressed={ariaPressed}
          className={buttonClassName}
          disabled={disabled}
          onClick={onClick}
          tabIndex={tabIndex}
          type='button'>
          <div className={mediaWrapperClassNameResolved}>{children}</div>
          {showHoverOverlay ? <div aria-hidden className={styles.hoverOverlay} /> : null}
        </button>
        {overflowMenu}
      </div>
    </div>
  );
};

export default SelectableMediaTile;

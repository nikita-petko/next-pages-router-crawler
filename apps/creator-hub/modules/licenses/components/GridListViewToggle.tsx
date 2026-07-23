import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { clsx, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  LicenseManagerClickEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import type { ExploreLicensesBrowseView } from '../hooks/useExploreLicensesBrowseView';
import styles from './GridListViewToggle.module.css';

const BUTTON_CHROME_RESET = {
  boxShadow: 'none',
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
};

const TOGGLE_BUTTON_CLASS =
  'inline-flex items-center justify-center margin-none border-none stroke-none cursor-pointer radius-large padding-medium transition-colors content-emphasis outline-none focus-visible:outline-focus';

export interface GridListViewToggleProps {
  value: ExploreLicensesBrowseView;
  onChange: (value: ExploreLicensesBrowseView) => void;
}

const GridListViewToggle: FunctionComponent<GridListViewToggleProps> = ({ value, onChange }) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const browseLayoutGroupLabel = `${translate('Label.Grid')}, ${translate('Label.List')}`;

  const handleGridClick = useCallback(() => {
    logEvent(LicenseManagerClickEvent.ExploreLicensesBrowseViewToggleClickEvent, {
      selectedView: 'grid',
    });
    onChange('grid');
  }, [logEvent, onChange]);

  const handleListClick = useCallback(() => {
    logEvent(LicenseManagerClickEvent.ExploreLicensesBrowseViewToggleClickEvent, {
      selectedView: 'list',
    });
    onChange('list');
  }, [logEvent, onChange]);

  return (
    <div
      role='radiogroup'
      aria-label={browseLayoutGroupLabel}
      className='items-center gap-small inline-flex'
      data-testid='explore-licenses-browse-view-toggle'>
      <button
        type='button'
        role='radio'
        aria-checked={value === 'grid'}
        aria-label={translate('Label.Grid')}
        className={clsx(
          TOGGLE_BUTTON_CLASS,
          value === 'grid' ? styles.toggleButtonActive : styles.toggleButtonInactive,
        )}
        style={BUTTON_CHROME_RESET}
        onClick={handleGridClick}>
        <Icon name='icon-regular-grid' size='Medium' aria-hidden />
      </button>
      <button
        type='button'
        role='radio'
        aria-checked={value === 'list'}
        aria-label={translate('Label.List')}
        className={clsx(
          TOGGLE_BUTTON_CLASS,
          value === 'list' ? styles.toggleButtonActive : styles.toggleButtonInactive,
        )}
        style={BUTTON_CHROME_RESET}
        onClick={handleListClick}>
        <Icon name='icon-regular-list-bulleted' size='Medium' aria-hidden />
      </button>
    </div>
  );
};

export default GridListViewToggle;

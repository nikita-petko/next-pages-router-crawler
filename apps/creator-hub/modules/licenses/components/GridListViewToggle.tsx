import type { FunctionComponent } from 'react';
import { clsx, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import styles from './GridListViewToggle.module.css';

const BUTTON_CHROME_RESET = {
  boxShadow: 'none',
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
};

const TOGGLE_BUTTON_CLASS =
  'inline-flex items-center justify-center margin-none border-none stroke-none cursor-pointer radius-large padding-medium transition-colors content-emphasis outline-none focus-visible:outline-focus';

export type GridListView = 'grid' | 'list';

export interface GridListViewToggleProps {
  value: GridListView;
  onChange: (value: GridListView) => void;
  testId?: string;
}

const GridListViewToggle: FunctionComponent<GridListViewToggleProps> = ({
  value,
  onChange,
  testId = 'grid-list-view-toggle',
}) => {
  const { translate } = useTranslation();

  const browseLayoutGroupLabel = `${translate('Label.Grid')}, ${translate('Label.List')}`;

  return (
    <div
      role='radiogroup'
      aria-label={browseLayoutGroupLabel}
      className='items-center gap-small inline-flex'
      data-testid={testId}>
      <button
        type='button'
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Icon toggle buttons need radio selection semantics.
        role='radio'
        aria-checked={value === 'grid'}
        aria-label={translate('Label.Grid')}
        className={clsx(
          TOGGLE_BUTTON_CLASS,
          value === 'grid' ? styles.toggleButtonActive : styles.toggleButtonInactive,
        )}
        style={BUTTON_CHROME_RESET}
        onClick={() => onChange('grid')}>
        <Icon name='icon-regular-grid' size='Medium' aria-hidden />
      </button>
      <button
        type='button'
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Icon toggle buttons need radio selection semantics.
        role='radio'
        aria-checked={value === 'list'}
        aria-label={translate('Label.List')}
        className={clsx(
          TOGGLE_BUTTON_CLASS,
          value === 'list' ? styles.toggleButtonActive : styles.toggleButtonInactive,
        )}
        style={BUTTON_CHROME_RESET}
        onClick={() => onChange('list')}>
        <Icon name='icon-regular-list-bulleted' size='Medium' aria-hidden />
      </button>
    </div>
  );
};

export default GridListViewToggle;

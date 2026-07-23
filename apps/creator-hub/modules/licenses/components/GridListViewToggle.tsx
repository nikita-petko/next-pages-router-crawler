import { FunctionComponent } from 'react';
import { makeStyles } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

import type { ExploreLicensesBrowseView } from '../hooks/useExploreLicensesBrowseView';

const useStyles = makeStyles()((theme) => ({
  track: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 9999,
    padding: theme.spacing(0.5),
    backgroundColor: theme.palette.actionV2.secondary.fill,
    gap: theme.spacing(0.25),
  },
  segment: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
    borderRadius: 9999,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.body2.lineHeight,
    transition: theme.transitions.create(['background-color', 'color'], {
      duration: theme.transitions.duration.shorter,
    }),
  },
  segmentActive: {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.content.action,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
    color: theme.palette.content.muted,
  },
  icon: {
    display: 'flex',
    flexShrink: 0,
  },
}));

const GridLayoutIcon: FunctionComponent<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width={20}
    height={20}
    viewBox='0 0 24 24'
    aria-hidden
    focusable='false'>
    <path fill='currentColor' d='M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z' />
  </svg>
);

const ListLayoutIcon: FunctionComponent<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width={20}
    height={20}
    viewBox='0 0 24 24'
    aria-hidden
    focusable='false'>
    <circle cx='5' cy='7' r='2' fill='currentColor' />
    <circle cx='5' cy='12' r='2' fill='currentColor' />
    <circle cx='5' cy='17' r='2' fill='currentColor' />
    <path fill='currentColor' d='M9 6h12v2H9V6zm0 5h12v2H9v-2zm0 5h12v2H9v-2z' />
  </svg>
);

export interface GridListViewToggleProps {
  value: ExploreLicensesBrowseView;
  onChange: (value: ExploreLicensesBrowseView) => void;
}

const GridListViewToggle: FunctionComponent<GridListViewToggleProps> = ({ value, onChange }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <div
      role='radiogroup'
      aria-label='Browse layout'
      className={classes.track}
      data-testid='explore-licenses-browse-view-toggle'>
      <button
        type='button'
        role='radio'
        aria-checked={value === 'grid'}
        className={`${classes.segment} ${
          value === 'grid' ? classes.segmentActive : classes.segmentInactive
        }`}
        onClick={() => onChange('grid')}>
        <GridLayoutIcon className={classes.icon} />
        <span>{translate('Label.Grid')}</span>
      </button>
      <button
        type='button'
        role='radio'
        aria-checked={value === 'list'}
        className={`${classes.segment} ${
          value === 'list' ? classes.segmentActive : classes.segmentInactive
        }`}
        onClick={() => onChange('list')}>
        <ListLayoutIcon className={classes.icon} />
        <span>{translate('Label.List')}</span>
      </button>
    </div>
  );
};

export default GridListViewToggle;

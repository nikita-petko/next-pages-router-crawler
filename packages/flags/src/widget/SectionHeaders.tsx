import React from 'react';
import { Icon, clsx } from '@rbx/foundation-ui';
import { MAX_RECENTLY_CHANGED } from './constants';

export function NamespaceSectionHeader({
  namespace,
  count,
  collapsed,
  onToggle,
}: {
  namespace: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      className={clsx(
        'flex',
        'items-center',
        'gap-xsmall',
        'padding-y-xsmall',
        'padding-x-xsmall',
        'bg-surface-100',
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        width: '100%',
        border: 'none',
        borderBlockEnd: '1px solid var(--color-stroke-emphasis)',
        cursor: 'pointer',
      }}>
      <Icon
        name={collapsed ? 'icon-regular-chevron-small-down' : 'icon-regular-chevron-small-up'}
        size='XSmall'
        className={clsx('content-muted')}
      />
      <span
        className={clsx('text-caption-medium', 'content-emphasis')}
        style={{ flex: 1, textAlign: 'left' }}>
        {namespace}
      </span>
      <span className={clsx('text-caption-small', 'content-muted')}>({count})</span>
    </button>
  );
}

export function RecentlyChangedSectionHeader({
  count,
  collapsed,
  onToggle,
  onClear,
}: {
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={clsx(
        'flex',
        'items-center',
        'gap-xsmall',
        'padding-y-xsmall',
        'padding-x-xsmall',
        'bg-surface-100',
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        // Opaque theme-aware light-blue: soft-emphasis tint layered over the surface so
        // scrolling rows don't show through the sticky header (and it adapts to dark mode).
        backgroundImage:
          'linear-gradient(var(--color-action-soft-emphasis-background), var(--color-action-soft-emphasis-background))',
        borderBottom: '1px solid var(--color-stroke-emphasis)',
      }}>
      <button
        type='button'
        onClick={onToggle}
        className={clsx('flex', 'items-center', 'gap-xsmall')}
        style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Icon
          name={collapsed ? 'icon-regular-chevron-small-down' : 'icon-regular-chevron-small-up'}
          size='XSmall'
          className={clsx('content-muted')}
        />
        <span className={clsx('text-caption-medium', 'content-emphasis')}>
          Recently Changed (max {MAX_RECENTLY_CHANGED})
        </span>
      </button>
      <span className={clsx('text-caption-small', 'content-muted')}>({count})</span>
      <button
        type='button'
        title='Clear recent list'
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        className={clsx('text-caption-small', 'content-muted')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
        aria-label='Clear recently changed flags'>
        x
      </button>
    </div>
  );
}

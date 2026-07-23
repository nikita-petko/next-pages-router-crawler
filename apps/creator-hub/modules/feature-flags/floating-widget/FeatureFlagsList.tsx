import React, { useCallback, useMemo } from 'react';
import { Icon } from '@rbx/foundation-ui';
import cn from './strictly';
import { FeatureFlagNamespace } from '../namespaces';
import { TFlag } from '../types';
import useLocalFlagOverrides, {
  useRecentlyChangedFlags,
  useCollapsedSections,
} from './localOverride';
import { useFeatureFlagsForNamespace } from '../context/FeatureFlagsProvider';
import TriStateSwitch, { OverrideState } from './TriStateSwitch';

interface FeatureFlagItem<TNamespace extends FeatureFlagNamespace> {
  flag: TFlag<TNamespace>;
  namespace: TNamespace;
}

interface FeatureFlagsListProps<TNamespace extends FeatureFlagNamespace> {
  items: FeatureFlagItem<TNamespace>[];
}

/** Sticky, collapsible section header for namespace groups */
const NamespaceSectionHeader: React.FC<{
  namespace: FeatureFlagNamespace;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}> = ({ namespace, count, collapsed, onToggle }) => (
  <button
    type='button'
    onClick={onToggle}
    className={cn(
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
      borderBottom: '1px solid var(--color-stroke-emphasis)',
      width: '100%',
      border: 'none',
      borderBlockEnd: '1px solid var(--color-stroke-emphasis)',
      cursor: 'pointer',
      background: 'inherit',
    }}>
    <Icon
      name={collapsed ? 'icon-regular-chevron-small-down' : 'icon-regular-chevron-small-up'}
      size='XSmall'
      className={cn('content-muted')}
    />
    <span
      className={cn('text-caption-medium', 'content-emphasis')}
      style={{ flex: 1, textAlign: 'left' }}>
      {namespace}
    </span>
    <span className={cn('text-caption-small', 'content-muted')}>({count})</span>
  </button>
);

const RecentlyChangedSectionHeader: React.FC<{
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onClear: () => void;
}> = ({ count, collapsed, onToggle, onClear }) => (
  <div
    className={cn(
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
      borderBottom: '1px solid var(--color-stroke-emphasis)',
    }}>
    <button
      type='button'
      onClick={onToggle}
      className={cn('flex', 'items-center', 'gap-xsmall')}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}>
      <Icon
        name={collapsed ? 'icon-regular-chevron-small-down' : 'icon-regular-chevron-small-up'}
        size='XSmall'
        className={cn('content-muted')}
      />
      <span className={cn('text-caption-medium', 'content-emphasis')}>Recently Changed</span>
    </button>
    <span className={cn('text-caption-small', 'content-muted')}>({count})</span>
    <button
      type='button'
      title='Clear recent list'
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      className={cn('text-caption-small', 'content-muted')}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 2px',
      }}
      aria-label='Clear recently changed flags'>
      ×
    </button>
  </div>
);

const FlagItem: React.FC<
  FeatureFlagItem<FeatureFlagNamespace> & {
    value: boolean | undefined;
    overrideFlag: (
      flag: TFlag<FeatureFlagNamespace>,
      value: boolean | undefined,
      namespace: FeatureFlagNamespace,
    ) => void;
  }
> = ({ flag, namespace, value, overrideFlag }) => {
  const { [flag]: flagValue } = useFeatureFlagsForNamespace(flag, namespace);

  const getOverrideState = (): OverrideState => {
    if (value === undefined) return 'auto';
    if (value) return 'on';
    return 'off';
  };
  const overrideState = getOverrideState();

  const onStateChange = useCallback(
    (state: OverrideState) => {
      const newValue = state === 'auto' ? undefined : state === 'on';
      overrideFlag(flag, newValue, namespace);
    },
    [flag, namespace, overrideFlag],
  );

  return (
    <div
      data-list-item
      className={cn(
        'flex',
        'justify-between',
        'items-center',
        'padding-xsmall',
        'gap-small',
        'radius-small',
      )}
      style={{ minHeight: 32 }}>
      <span
        className={cn('text-body-small', 'text-truncate-end', 'text-no-wrap')}
        style={{ flex: 1 }}>
        {flag}
      </span>
      <Icon
        name={flagValue ? 'icon-filled-check' : 'icon-filled-x-small'}
        size='Small'
        className={cn(flagValue ? 'content-system-success' : 'content-system-alert')}
      />
      <TriStateSwitch value={overrideState} onChange={onStateChange} />
    </div>
  );
};

interface GroupedItems {
  namespace: FeatureFlagNamespace;
  items: Array<FeatureFlagItem<FeatureFlagNamespace> & { value: boolean | undefined }>;
}

const RECENTLY_CHANGED_SECTION_KEY = '__recently_changed__';

const FeatureFlagsList: React.FC<FeatureFlagsListProps<FeatureFlagNamespace>> = ({ items }) => {
  const { localFlagOverrides, overrideFlag } = useLocalFlagOverrides();
  const { recentlyChanged, recordFlagChange, clearRecentlyChanged } = useRecentlyChangedFlags();
  const { isSectionCollapsed, toggleSection } = useCollapsedSections();

  const overrideFlagAndRecord = useCallback(
    (
      flag: TFlag<FeatureFlagNamespace>,
      value: boolean | undefined,
      namespace: FeatureFlagNamespace,
    ) => {
      overrideFlag(flag, value, namespace);
      recordFlagChange(flag, namespace);
    },
    [overrideFlag, recordFlagChange],
  );

  const recentlyChangedKeys = useMemo(
    () => new Set(recentlyChanged.map((entry) => `${entry.namespace}:${entry.flag}`)),
    [recentlyChanged],
  );

  // Recently changed items that exist in the current (search/filter-respecting) item list
  const recentItems = useMemo(() => {
    return recentlyChanged
      .map((entry) => {
        const item = items.find((i) => i.flag === entry.flag && i.namespace === entry.namespace);
        if (!item) return null;
        const flags = localFlagOverrides[entry.namespace]?.flags as
          | Record<string, boolean | undefined>
          | undefined;
        const value = flags?.[entry.flag];
        return { ...item, value };
      })
      .filter(
        (item): item is FeatureFlagItem<FeatureFlagNamespace> & { value: boolean | undefined } =>
          item !== null,
      );
  }, [recentlyChanged, items, localFlagOverrides]);

  // Group remaining items by namespace, excluding recently changed flags
  const groupedByNamespace = useMemo(() => {
    const groups = new Map<FeatureFlagNamespace, GroupedItems['items']>();

    items.forEach((item) => {
      const { namespace, flag } = item;
      if (recentlyChangedKeys.has(`${namespace}:${flag}`)) return;

      const flags = localFlagOverrides[namespace]?.flags as
        | Record<string, boolean | undefined>
        | undefined;
      const value = flags?.[flag];
      const itemWithValue = { ...item, value };

      if (!groups.has(namespace)) {
        groups.set(namespace, []);
      }
      groups.get(namespace)!.push(itemWithValue);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([namespace, groupItems]): GroupedItems => ({ namespace, items: groupItems }));
  }, [items, localFlagOverrides, recentlyChangedKeys]);

  const hasItems =
    recentItems.length > 0 || groupedByNamespace.some((group) => group.items.length > 0);

  return (
    <div
      className={cn('flex', 'flex-col')}
      style={{
        maxHeight: 240,
        overflowY: 'auto',
        paddingRight: 4,
        marginRight: -4,
      }}>
      {hasItems ? (
        <React.Fragment>
          {recentItems.length > 0 && (
            <div className={cn('flex', 'flex-col')}>
              <RecentlyChangedSectionHeader
                count={recentItems.length}
                collapsed={isSectionCollapsed(RECENTLY_CHANGED_SECTION_KEY)}
                onToggle={() => toggleSection(RECENTLY_CHANGED_SECTION_KEY)}
                onClear={clearRecentlyChanged}
              />
              {!isSectionCollapsed(RECENTLY_CHANGED_SECTION_KEY) &&
                recentItems.map((item) => (
                  <FlagItem
                    key={`recent-${item.namespace}-${item.flag}`}
                    flag={item.flag}
                    namespace={item.namespace}
                    value={item.value}
                    overrideFlag={overrideFlagAndRecord}
                  />
                ))}
            </div>
          )}
          {groupedByNamespace.map((group) => (
            <div key={group.namespace} className={cn('flex', 'flex-col')}>
              <NamespaceSectionHeader
                namespace={group.namespace}
                count={group.items.length}
                collapsed={isSectionCollapsed(group.namespace)}
                onToggle={() => toggleSection(group.namespace)}
              />
              {!isSectionCollapsed(group.namespace) &&
                group.items.map((item) => (
                  <FlagItem
                    key={`${item.namespace}-${item.flag}`}
                    flag={item.flag}
                    namespace={item.namespace}
                    value={item.value}
                    overrideFlag={overrideFlagAndRecord}
                  />
                ))}
            </div>
          ))}
        </React.Fragment>
      ) : (
        <div
          className={cn('padding-medium', 'text-body-small')}
          style={{ textAlign: 'center', opacity: 0.6 }}>
          No items found
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsList;

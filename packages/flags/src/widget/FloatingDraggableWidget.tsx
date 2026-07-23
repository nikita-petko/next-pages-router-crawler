import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import {
  Button,
  Icon,
  IconButton,
  TextInput,
  Tooltip,
  TooltipTrigger,
  clsx,
} from '@rbx/foundation-ui';
import {
  COLLAPSED_SIZE,
  RECENTLY_CHANGED_SECTION_KEY,
  SEARCH_INPUT_CONTAINER_STYLE,
} from './constants';
import { ActiveFilterChips, NamespaceFiltersSection } from './FilterControls';
import FlagRow from './FlagRow';
import { evaluateFlagItem, formatEvaluationContext, sortFlagItems } from './flagUtils';
import { useCollapsedSections, useRecentlyChangedFlags } from './hooks';
import { NamespaceSectionHeader, RecentlyChangedSectionHeader } from './SectionHeaders';
import { getBoundedPosition, readPosition, writePosition } from './storage';
import type { FlagItem, Position, WidgetProps } from './widgetTypes';

// UI-friendly proxy for the `window.rbxFlags` console tool. Override writes stay
// on the shared console API so manual and widget-driven overrides behave identically.
export default function FloatingDraggableWidget({ flags, contexts }: WidgetProps) {
  const initialPosition = useMemo(() => getBoundedPosition(readPosition()), []);
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(new Set());
  const widgetRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position>(initialPosition);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const { isSectionCollapsed, toggleSection } = useCollapsedSections();
  const { recentlyChanged, recordFlagChange, clearRecentlyChanged } = useRecentlyChangedFlags();

  const allItems = useMemo(() => sortFlagItems(flags), [flags]);
  const allNamespaces = useMemo(
    () =>
      Array.from(new Set(allItems.map((item) => item.metadata.namespace))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [allItems],
  );
  const namespaceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allItems.forEach((item) => {
      counts.set(item.metadata.namespace, (counts.get(item.metadata.namespace) ?? 0) + 1);
    });
    return counts;
  }, [allItems]);
  const visibleItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      return (
        (selectedNamespaces.size === 0 || selectedNamespaces.has(item.metadata.namespace)) &&
        (query.length === 0 ||
          item.metadata.name.toLowerCase().includes(query) ||
          item.metadata.namespace.toLowerCase().includes(query))
      );
    });
  }, [allItems, deferredSearchQuery, selectedNamespaces]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, FlagItem[]>();
    visibleItems.forEach((item) => {
      const group = groups.get(item.metadata.namespace) ?? [];
      group.push(item);
      groups.set(item.metadata.namespace, group);
    });
    return Array.from(groups.entries());
  }, [visibleItems]);
  const recentItems = useMemo(() => {
    const visibleItemsByKey = new Map(
      visibleItems.map((item) => [`${item.metadata.namespace}:${item.metadata.name}`, item]),
    );
    return recentlyChanged
      .map((entry) => visibleItemsByKey.get(`${entry.namespace}:${entry.name}`))
      .filter((item): item is FlagItem => item !== undefined);
  }, [recentlyChanged, visibleItems]);

  const getNamespaceFlagCount = useCallback(
    (namespace: string) => namespaceCounts.get(namespace) ?? 0,
    [namespaceCounts],
  );

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    if (event.target.closest('button') || event.target.closest('input')) {
      return;
    }
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setIsDragging(true);
  }, []);

  // Keep dragging responsive outside the widget while avoiding full React re-renders per mousemove.
  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const bounded = getBoundedPosition({
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      });
      positionRef.current = bounded;
      x.set(bounded.x);
      y.set(bounded.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      writePosition(positionRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, x, y]);

  // Stop app-level focus listeners from reacting to interactions inside the floating widget.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) {
      return undefined;
    }
    const stopFocusPropagation = (event: FocusEvent) => event.stopPropagation();
    widget.addEventListener('focusin', stopFocusPropagation);
    return () => widget.removeEventListener('focusin', stopFocusPropagation);
  }, []);

  // Re-clamp the stored widget position when the viewport changes size.
  useEffect(() => {
    const constrainToViewport = () => {
      const current = positionRef.current;
      const bounded = getBoundedPosition(current);
      if (bounded.x !== current.x || bounded.y !== current.y) {
        positionRef.current = bounded;
        x.set(bounded.x);
        y.set(bounded.y);
        writePosition(bounded);
      }
    };

    window.addEventListener('resize', constrainToViewport);
    return () => window.removeEventListener('resize', constrainToViewport);
  }, [x, y]);

  const handleNamespaceToggle = useCallback((namespace: string, checked: boolean) => {
    setSelectedNamespaces((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(namespace);
      } else {
        next.delete(namespace);
      }
      return next;
    });
  }, []);

  const handleClearAllOverrides = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    window.rbxFlags.clear();
  }, []);

  const evaluateItem = useCallback(
    async (item: FlagItem): Promise<unknown> => {
      return evaluateFlagItem(item, contexts);
    },
    [contexts],
  );

  const copyAllFlags = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      const entries = await Promise.all(
        allItems.map(async (item) => ({
          item,
          value: await evaluateItem(item),
        })),
      );
      const valuesByNamespace: Record<string, Record<string, unknown>> = {};
      entries.forEach(({ item, value }) => {
        valuesByNamespace[item.metadata.namespace] = {
          ...valuesByNamespace[item.metadata.namespace],
          [item.metadata.name]: value,
        };
      });
      await navigator.clipboard.writeText(JSON.stringify(valuesByNamespace, null, 2));
    },
    [allItems, evaluateItem],
  );

  const widgetWidth = isExpanded ? 320 : COLLAPSED_SIZE;

  return (
    <motion.div
      role='application'
      ref={widgetRef}
      className={clsx(
        'fixed',
        'bg-surface-100',
        'radius-large',
        'stroke-thin',
        'stroke-emphasis',
        'no-clip',
      )}
      aria-label='Feature flags override widget'
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsExpanded(false);
        }
      }}
      animate={{
        width: widgetWidth,
        height: isExpanded ? 'auto' : COLLAPSED_SIZE,
        scale: isDragging ? 0.95 : 1,
      }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      whileHover={!isDragging ? { scale: 1.02 } : {}}
      style={{
        left: 0,
        top: 0,
        x,
        y,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
      }}>
      <div className={clsx('flex', 'flex-col', 'width-full')}>
        <div
          className={clsx('flex', 'items-center', 'padding-medium', 'gap-medium')}
          style={{ minHeight: COLLAPSED_SIZE }}>
          <Tooltip
            position='top-center'
            title='Override feature flags locally'
            description='Drag around. Only visible when local overrides are authorized.'>
            <TooltipTrigger asChild>
              <div
                className={clsx('flex', 'items-center', 'justify-center', 'shrink-0')}
                style={{ width: 32, height: 32 }}>
                <Icon
                  name='icon-filled-flag'
                  size='Small'
                  className={clsx('content-system-warning')}
                />
              </div>
            </TooltipTrigger>
          </Tooltip>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.1, ease: 'easeInOut' }}
                className={clsx('text-body-medium', 'text-no-wrap')}
                style={{ flex: 1 }}>
                Feature Flags Override
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className={clsx('flex', 'gap-xsmall')}>
                <Tooltip position='top-center' title='Copy all flag states as JSON'>
                  <TooltipTrigger asChild>
                    <Button size='XSmall' variant='Utility' onClick={copyAllFlags}>
                      Copy
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
                <Tooltip position='top-center' title='Reset all flag overrides'>
                  <TooltipTrigger asChild>
                    <Button size='XSmall' variant='Standard' onClick={handleClearAllOverrides}>
                      Reset
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.1, ease: 'easeInOut' }}
              className={clsx(
                'flex',
                'flex-col',
                'gap-medium',
                'padding-x-medium',
                'padding-bottom-medium',
              )}>
              <div className={clsx('text-caption-small', 'content-muted')}>
                {formatEvaluationContext(contexts)}
              </div>
              <div className={clsx('flex', 'items-center', 'gap-small')}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    size='Small'
                    placeholder='Search...'
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    leadingIconName='icon-regular-magnifying-glass'
                    inputContainerClassStyle={SEARCH_INPUT_CONTAINER_STYLE}
                  />
                </div>
                <Tooltip position='top-center' title='Filter flags by namespaces'>
                  <TooltipTrigger asChild>
                    <IconButton
                      size='Small'
                      icon='icon-regular-three-sliders-horizontal'
                      variant={showFilters ? 'Standard' : 'Utility'}
                      onClick={(event: React.MouseEvent) => {
                        event.stopPropagation();
                        setShowFilters((prev) => !prev);
                      }}
                      ariaLabel={showFilters ? 'Hide filters' : 'Show filters'}
                    />
                  </TooltipTrigger>
                </Tooltip>
              </div>
              <div>
                <NamespaceFiltersSection
                  showFilters={showFilters}
                  allNamespaces={allNamespaces}
                  selectedNamespaces={selectedNamespaces}
                  getNamespaceFlagCount={getNamespaceFlagCount}
                  onNamespaceToggle={handleNamespaceToggle}
                  onNamespaceIsolate={(namespace) => setSelectedNamespaces(new Set([namespace]))}
                />
                {!showFilters && (
                  <ActiveFilterChips
                    selectedNamespaces={selectedNamespaces}
                    allNamespaces={allNamespaces}
                    onRemoveNamespace={(namespace) => handleNamespaceToggle(namespace, false)}
                  />
                )}
              </div>
              <div
                className={clsx('flex', 'flex-col', 'padding-right-medium', 'scroll-y')}
                style={{ maxHeight: 240, marginRight: -4 }}>
                {recentItems.length > 0 && (
                  <div className={clsx('flex', 'flex-col')}>
                    <RecentlyChangedSectionHeader
                      count={recentItems.length}
                      collapsed={isSectionCollapsed(RECENTLY_CHANGED_SECTION_KEY)}
                      onToggle={() => toggleSection(RECENTLY_CHANGED_SECTION_KEY)}
                      onClear={clearRecentlyChanged}
                    />
                    {!isSectionCollapsed(RECENTLY_CHANGED_SECTION_KEY) &&
                      recentItems.map((item) => (
                        <FlagRow
                          key={`recent-${item.metadata.namespace}:${item.metadata.name}`}
                          item={item}
                          contexts={contexts}
                          onOverrideChange={recordFlagChange}
                        />
                      ))}
                  </div>
                )}
                {groupedItems.length === 0 ? (
                  <div
                    className={clsx('padding-medium', 'text-body-small')}
                    style={{ textAlign: 'center', opacity: 0.6 }}>
                    No items found
                  </div>
                ) : (
                  groupedItems.map(([namespace, items]) => (
                    <div key={namespace} className={clsx('flex', 'flex-col')}>
                      <NamespaceSectionHeader
                        namespace={namespace}
                        count={items.length}
                        collapsed={isSectionCollapsed(namespace)}
                        onToggle={() => toggleSection(namespace)}
                      />
                      {!isSectionCollapsed(namespace) &&
                        items.map((item) => (
                          <FlagRow
                            key={`${item.metadata.namespace}:${item.metadata.name}`}
                            item={item}
                            contexts={contexts}
                            onOverrideChange={recordFlagChange}
                          />
                        ))}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

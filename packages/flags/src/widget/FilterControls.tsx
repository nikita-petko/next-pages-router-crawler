import React, { type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Checkbox, Icon, clsx } from '@rbx/foundation-ui';

const namespaceListStyle: CSSProperties = {
  flexWrap: 'wrap',
  maxHeight: 120,
  overflowY: 'auto',
  // Move the scrollbar into the section's right padding while preserving a
  // comfortable gutter between wrapped namespace labels and the scroll thumb.
  marginRight: -8,
  paddingRight: 16,
  scrollbarGutter: 'stable',
};

export function NamespaceFiltersSection({
  showFilters,
  allNamespaces,
  selectedNamespaces,
  getNamespaceFlagCount,
  onNamespaceToggle,
  onNamespaceIsolate,
}: {
  showFilters: boolean;
  allNamespaces: string[];
  selectedNamespaces: Set<string>;
  getNamespaceFlagCount: (namespace: string) => number;
  onNamespaceToggle: (namespace: string, checked: boolean) => void;
  onNamespaceIsolate: (namespace: string) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}>
          <div className={clsx('flex', 'flex-col', 'gap-small', 'padding-small', 'bg-surface-200')}>
            <div className={clsx('text-caption-medium')}>Filter by Namespace</div>
            <div className={clsx('flex', 'flex-row', 'gap-small')} style={namespaceListStyle}>
              {allNamespaces.map((namespace) => {
                const isChecked = selectedNamespaces.has(namespace);
                return (
                  <button
                    key={namespace}
                    type='button'
                    data-list-item
                    onClick={() => onNamespaceToggle(namespace, !isChecked)}
                    onDoubleClick={() => onNamespaceIsolate(namespace)}
                    className={clsx('flex', 'items-center', 'padding-xsmall', 'gap-xsmall')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Checkbox
                      label=''
                      size='XSmall'
                      placement='Start'
                      isChecked={isChecked}
                      onCheckedChange={(checked) => onNamespaceToggle(namespace, checked === true)}
                    />
                    <span className={clsx('text-body-small', 'text-no-wrap')}>{namespace}</span>
                    <span
                      className={clsx('text-caption-small', 'text-no-wrap')}
                      style={{ opacity: 0.6 }}>
                      ({getNamespaceFlagCount(namespace)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ActiveFilterChips({
  selectedNamespaces,
  allNamespaces,
  onRemoveNamespace,
}: {
  selectedNamespaces: Set<string>;
  allNamespaces: string[];
  onRemoveNamespace: (namespace: string) => void;
}) {
  if (selectedNamespaces.size === 0 || selectedNamespaces.size >= allNamespaces.length) {
    return null;
  }

  return (
    <div className={clsx('flex', 'flex-row', 'gap-xsmall')} style={{ flexWrap: 'wrap' }}>
      {Array.from(selectedNamespaces).map((namespace) => (
        <div
          key={namespace}
          className={clsx(
            'flex',
            'items-center',
            'gap-xsmall',
            'padding-x-small',
            'padding-y-xsmall',
            'radius-small',
            'bg-surface-200',
          )}>
          <span className={clsx('text-caption-small')}>{namespace}</span>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRemoveNamespace(namespace);
            }}
            className={clsx('flex', 'items-center', 'justify-center', 'cursor-pointer')}
            style={{ border: 'none', background: 'none', padding: 0, width: 16, height: 16 }}
            aria-label={`Remove ${namespace} filter`}>
            <Icon name='icon-regular-x-small' size='XSmall' />
          </button>
        </div>
      ))}
    </div>
  );
}

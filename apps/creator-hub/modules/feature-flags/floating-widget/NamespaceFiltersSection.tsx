import React from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { motion, AnimatePresence } from 'motion/react';
import cn from './strictly';
import { FeatureFlagNamespace, FeatureFlagsByNamespace } from '../namespaces';

interface NamespaceFiltersSectionProps {
  showFilters: boolean;
  allNamespaces: FeatureFlagNamespace[];
  selectedNamespaces: Set<FeatureFlagNamespace>;
  onNamespaceToggle: (namespace: FeatureFlagNamespace, checked: boolean) => void;
  onNamespaceIsolate: (namespace: FeatureFlagNamespace) => void;
}

const NamespaceFiltersSection: React.FC<NamespaceFiltersSectionProps> = ({
  showFilters,
  allNamespaces,
  selectedNamespaces,
  onNamespaceToggle,
  onNamespaceIsolate,
}) => {
  return (
    <AnimatePresence initial={false}>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}>
          <div className={cn('flex', 'flex-col', 'gap-small', 'padding-small', 'bg-surface-200')}>
            <div className={cn('text-caption-medium')}>Filter by Namespace</div>
            <div
              className={cn('flex', 'flex-row', 'gap-small')}
              style={{
                flexWrap: 'wrap',
                maxHeight: 120,
                overflowY: 'auto',
                paddingRight: 4,
                marginRight: -4,
              }}>
              {allNamespaces.map((namespace) => {
                const count = FeatureFlagsByNamespace[namespace].flags.length;
                const isChecked = selectedNamespaces.has(namespace);
                return (
                  <button
                    key={namespace}
                    type='button'
                    data-list-item
                    onClick={() => onNamespaceToggle(namespace, !isChecked)}
                    onDoubleClick={() => onNamespaceIsolate(namespace)}
                    className={cn('flex', 'items-center', 'padding-xsmall', 'gap-xsmall')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}>
                    <Checkbox
                      label=''
                      size='XSmall'
                      placement='Start'
                      isChecked={isChecked}
                      onCheckedChange={(checked) => onNamespaceToggle(namespace, checked === true)}
                    />
                    <span className={cn('text-body-small', 'text-no-wrap')}>{namespace}</span>
                    <span
                      className={cn('text-caption-small', 'text-no-wrap')}
                      style={{ opacity: 0.6 }}>
                      ({count})
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
};

export default NamespaceFiltersSection;

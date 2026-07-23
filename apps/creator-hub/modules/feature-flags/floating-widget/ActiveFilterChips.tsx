import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import cn from './strictly';
import { FeatureFlagNamespace } from '../namespaces';

interface ActiveFilterChipsProps {
  selectedNamespaces: Set<FeatureFlagNamespace>;
  allNamespaces: FeatureFlagNamespace[];
  onRemoveNamespace: (namespace: FeatureFlagNamespace) => void;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  selectedNamespaces,
  allNamespaces,
  onRemoveNamespace,
}) => {
  // Only show chips if some (but not all) namespaces are selected
  if (selectedNamespaces.size === 0 || selectedNamespaces.size >= allNamespaces.length) {
    return null;
  }

  return (
    <div className={cn('flex', 'flex-row', 'gap-xsmall')} style={{ flexWrap: 'wrap' }}>
      {Array.from(selectedNamespaces).map((namespace) => (
        <div
          key={namespace}
          className={cn(
            'flex',
            'items-center',
            'gap-xsmall',
            'padding-x-small',
            'padding-y-xsmall',
            'radius-small',
            'bg-surface-200',
          )}>
          <span className={cn('text-caption-small')}>{namespace}</span>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onRemoveNamespace(namespace);
            }}
            className={cn('flex', 'items-center', 'justify-center', 'cursor-pointer')}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              width: 16,
              height: 16,
            }}
            aria-label={`Remove ${namespace} filter`}>
            <Icon name='icon-regular-x-small' size='XSmall' />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveFilterChips;

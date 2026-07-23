import React, { useState, useRef, useEffect, useCallback, useContext, useMemo } from 'react';
import { TextInput, Icon, IconButton, Button, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useThemeMode } from '@rbx/settings';
import { useRouter } from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import cn from './strictly';
import { FeatureFlagNamespace, FeatureFlagsByNamespace } from '../namespaces';
import { EvaluationContext, TFlag } from '../types';
import NamespaceFiltersSection from './NamespaceFiltersSection';
import ActiveFilterChips from './ActiveFilterChips';
import FeatureFlagsList from './FeatureFlagsList';
import FeatureFlagsContext from '../context/FeatureFlagsContext';
import { FeatureFlagsProvider } from '../context/FeatureFlagsProvider';
import useIsEmployee from '../useIsEmployee';
import useLocalFlagOverrides from './localOverride';

/** Formats evaluation context for display */
const formatEvaluationContext = (
  evaluationContext: EvaluationContext,
  userId: number | undefined,
): string => {
  const parts: string[] = [];
  if (userId) parts.push(`user: ${userId}`);
  if (evaluationContext.universeId) parts.push(`universe: ${evaluationContext.universeId}`);
  return parts.length > 0 ? parts.join(' · ') : 'No context';
};

interface Position {
  x: number;
  y: number;
}

const arePositionsEqual = (first: Position, second: Position): boolean =>
  first.x === second.x && first.y === second.y;

const POSITION_STORAGE_KEY = 'feature-flags-widget-position';
const WIDGET_COLLAPSED_SIZE = 56;

/** Default position used during SSR, will be corrected on client */
const DEFAULT_POSITION: Position = { x: 20, y: 60 };

/** Calculate position for top-right placement near notification header */
const getTopRightPosition = (): Position => ({
  x: window.innerWidth - WIDGET_COLLAPSED_SIZE - 20,
  y: 60,
});

/**
 * Reads all resolved flag values from context (with local overrides applied)
 * and copies them to the clipboard as JSON.
 * Must be rendered inside a FeatureFlagsProvider.
 */
const CopyFlagsButton: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const featureFlagsContext = useContext(FeatureFlagsContext);
  const isEmployee = useIsEmployee();
  const { localFlagOverrides } = useLocalFlagOverrides();

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const allFlags: Record<string, Record<string, boolean>> = {};

      Object.values(FeatureFlagNamespace).forEach((namespace) => {
        const serverFlags = featureFlagsContext[namespace]?.flags as
          | Record<string, boolean | undefined>
          | undefined;

        const nsFlags: Record<string, boolean> = {};
        FeatureFlagsByNamespace[namespace].flags.forEach((flag) => {
          const localOverride = isEmployee
            ? (localFlagOverrides[namespace]?.flags as Record<string, boolean | undefined>)?.[flag]
            : undefined;
          nsFlags[flag] = localOverride ?? serverFlags?.[flag] ?? false;
        });

        allFlags[namespace] = nsFlags;
      });

      await navigator.clipboard.writeText(JSON.stringify(allFlags, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [featureFlagsContext, isEmployee, localFlagOverrides],
  );

  return (
    <Tooltip position='top-center' title={copied ? 'Copied!' : 'Copy all flag states as JSON'}>
      <TooltipTrigger asChild>
        <Button size='XSmall' variant='Utility' onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
};

const FloatingDraggableWidget: React.FC = () => {
  const isEmployee = useIsEmployee();
  const router = useRouter();
  const { user } = useAuthentication();
  const { themeMode } = useThemeMode();
  const isDark = themeMode === 'dark';

  // Compute evaluation context from URL (same logic as QueryBasedFeatureFlagsProvider)
  const evaluationContext: EvaluationContext = useMemo(() => {
    const { id } = router.query;
    if (typeof id === 'undefined' || Array.isArray(id)) {
      return {};
    }
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return {};
    }
    return { universeId: parsedId };
  }, [router.query]);

  const [savedPosition, setSavedPosition] = useLocalStorage<Position>(
    POSITION_STORAGE_KEY,
    DEFAULT_POSITION,
  );
  // Use local state for smooth dragging, sync to localStorage on drag end
  const [position, setPosition] = useState<Position>(savedPosition);

  const getBoundedPosition = useCallback((value: Position): Position => {
    const maxX = Math.max(0, window.innerWidth - WIDGET_COLLAPSED_SIZE);
    const maxY = Math.max(0, window.innerHeight - WIDGET_COLLAPSED_SIZE);

    return {
      x: Math.min(Math.max(0, value.x), maxX),
      y: Math.min(Math.max(0, value.y), maxY),
    };
  }, []);

  // On mount and when saved position changes, clamp to viewport bounds.
  // If it's still the default position, seed it to top-right first.
  useEffect(() => {
    const initialPosition =
      savedPosition.x === DEFAULT_POSITION.x && savedPosition.y === DEFAULT_POSITION.y
        ? getTopRightPosition()
        : savedPosition;
    const bounded = getBoundedPosition(initialPosition);

    setPosition((current) => (arePositionsEqual(current, bounded) ? current : bounded));
    if (!arePositionsEqual(savedPosition, bounded)) {
      setSavedPosition(bounded);
    }
  }, [getBoundedPosition, savedPosition, setSavedPosition]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { clearAllOverrides } = useLocalFlagOverrides();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow dragging from anywhere except inputs and buttons which need their own interactions
    const target = e.target as HTMLElement;
    const isClickOnInput = target.tagName === 'INPUT' || target.closest('input');
    const isClickOnButton = target.tagName === 'BUTTON' || target.closest('button');

    if (!isClickOnInput && !isClickOnButton) {
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsDragging(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setPosition(getBoundedPosition({ x: newX, y: newY }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Persist position to localStorage when drag ends
      setPosition((currentPosition) => {
        setSavedPosition(currentPosition);
        return currentPosition;
      });
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, getBoundedPosition, setSavedPosition]);

  // Utility function to constrain widget position within viewport bounds
  const constrainToViewport = useCallback(() => {
    setPosition((prev) => {
      const constrained = getBoundedPosition(prev);
      if (!arePositionsEqual(constrained, prev)) {
        setSavedPosition(constrained);
      }
      return constrained;
    });
  }, [getBoundedPosition, setSavedPosition]);

  // Handle window resize to keep widget within viewport bounds
  useEffect(() => {
    window.addEventListener('resize', constrainToViewport);

    return () => {
      window.removeEventListener('resize', constrainToViewport);
    };
  }, [constrainToViewport]);

  // Stop native focusin events from propagating to document level.
  // Modal focus traps (like Radix FocusScope) listen for focusin on document
  // and forcibly return focus to the modal. By stopping propagation here,
  // we prevent the focus trap from knowing focus moved to our widget.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return undefined;

    const stopFocusPropagation = (e: FocusEvent) => {
      e.stopPropagation();
    };

    widget.addEventListener('focusin', stopFocusPropagation);
    return () => {
      widget.removeEventListener('focusin', stopFocusPropagation);
    };
  }, []);

  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<FeatureFlagNamespace>>(
    new Set(Object.values(FeatureFlagNamespace)),
  );

  // Get unique namespaces
  const allNamespaces = Object.values(FeatureFlagNamespace).sort();

  const allFeatureFlags = allNamespaces.flatMap(<N extends FeatureFlagNamespace>(namespace: N) =>
    FeatureFlagsByNamespace[namespace].flags.map((flag): { flag: TFlag<N>; namespace: N } => ({
      flag,
      namespace,
    })),
  );

  const filteredItems = allFeatureFlags.filter(({ flag, namespace }) => {
    const matchesSearch = flag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNamespace = selectedNamespaces.size === 0 || selectedNamespaces.has(namespace);
    return matchesSearch && matchesNamespace;
  });

  const handleMouseEnter = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const handleMouseLeave = useCallback(() => {
    // Don't collapse while dragging - mouse can leave widget bounds during fast drags
    if (!isDragging) {
      setIsExpanded(false);
    }
  }, [isDragging]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Stop focus events from propagating to document level.
  // This prevents modal focus traps from stealing focus from our widget's inputs.
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    e.stopPropagation();
  }, []);

  const handleContentToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilters((prev) => !prev);
  }, []);

  const handleNamespaceToggle = useCallback((namespace: FeatureFlagNamespace, checked: boolean) => {
    setSelectedNamespaces((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(namespace);
      } else {
        newSet.delete(namespace);
      }
      return newSet;
    });
  }, []);

  const handleNamespaceIsolate = useCallback((namespace: FeatureFlagNamespace) => {
    setSelectedNamespaces(new Set([namespace]));
  }, []);

  const handleClearAllOverrides = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllOverrides();
    },
    [clearAllOverrides],
  );

  const getWidgetWidth = () => {
    if (!isExpanded) return WIDGET_COLLAPSED_SIZE;
    return 320;
  };

  if (!isEmployee) return null;

  return (
    <FeatureFlagsProvider namespaces={allNamespaces} evaluationContext={evaluationContext}>
      <motion.div
        ref={widgetRef}
        className={cn(
          'fixed',
          'bg-surface-100',
          'radius-large',
          'stroke-thin',
          'stroke-emphasis',
          'no-clip',
        )}
        style={{
          left: position.x,
          top: position.y,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          // Ensure widget remains interactive even when modals set pointer-events: none on body
          pointerEvents: 'auto',
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocusCapture}
        animate={{
          width: getWidgetWidth(),
          height: isExpanded ? 'auto' : WIDGET_COLLAPSED_SIZE,
          scale: isDragging ? 0.95 : 1,
        }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        whileHover={!isDragging ? { scale: 1.02 } : {}}
        aria-label='Feature flags override widget'>
        <div className={cn('flex', 'flex-col', 'width-full')}>
          {/* Header row - always visible with icon */}
          <div
            className={cn('flex', 'items-center', 'padding-medium', 'gap-medium')}
            style={{ minHeight: WIDGET_COLLAPSED_SIZE }}>
            <Tooltip
              position='top-center'
              title='Override feature flags locally'
              description='Drag around. Only visible to Roblox employees'>
              <TooltipTrigger asChild>
                <div
                  className={cn('flex', 'items-center', 'justify-center', 'shrink-0')}
                  style={{ width: 32, height: 32 }}>
                  <Icon
                    name='icon-filled-flag'
                    size='Small'
                    className={cn('content-system-warning')}
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
                  className={cn('text-body-medium', 'text-no-wrap')}
                  style={{ flex: 1 }}>
                  Feature Flags Override
                </motion.span>
              )}
            </AnimatePresence>
            {/* Action buttons - top right corner */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className={cn('flex', 'gap-xsmall')}>
                  <CopyFlagsButton />
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

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.1, ease: 'easeInOut' }}
                className={cn(
                  'flex',
                  'flex-col',
                  'gap-medium',
                  'padding-x-medium',
                  'padding-bottom-medium',
                )}>
                {/* Evaluation Context */}
                <div className={cn('text-caption-small', 'content-muted')}>
                  {formatEvaluationContext(evaluationContext, user?.id)}
                </div>

                {/* Search Bar with Filter Icon Button */}
                <div className={cn('flex', 'items-center', 'gap-small')}>
                  <div style={{ flex: 1 }}>
                    <TextInput
                      size='Small'
                      placeholder='Search...'
                      value={searchQuery}
                      onChange={handleSearchChange}
                      leadingIconName='icon-regular-magnifying-glass'
                    />
                  </div>
                  <Tooltip position='top-center' title='Filter flags by namespaces'>
                    <TooltipTrigger asChild>
                      <IconButton
                        size='Small'
                        icon='icon-regular-three-sliders-horizontal'
                        variant={showFilters ? 'Standard' : 'Utility'}
                        onClick={handleContentToggle}
                        ariaLabel={showFilters ? 'Hide filters' : 'Show filters'}
                      />
                    </TooltipTrigger>
                  </Tooltip>
                </div>

                {/* Namespace Filters Section - Persistent wrapper to prevent jank */}
                <div>
                  <NamespaceFiltersSection
                    showFilters={showFilters}
                    allNamespaces={allNamespaces}
                    selectedNamespaces={selectedNamespaces}
                    onNamespaceToggle={handleNamespaceToggle}
                    onNamespaceIsolate={handleNamespaceIsolate}
                  />

                  {/* Active Filters Chips - Only show when filters section is collapsed */}
                  {!showFilters && (
                    <ActiveFilterChips
                      selectedNamespaces={selectedNamespaces}
                      allNamespaces={allNamespaces}
                      onRemoveNamespace={(namespace) => handleNamespaceToggle(namespace, false)}
                    />
                  )}
                </div>

                {/* Feature Flags List */}
                <FeatureFlagsList items={filteredItems} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </FeatureFlagsProvider>
  );
};

export default FloatingDraggableWidget;

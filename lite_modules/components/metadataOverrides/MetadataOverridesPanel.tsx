import { Button } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import TriStateSwitch, { type TriStateValue } from '@components/metadataOverrides/TriStateSwitch';
import { useAppStore } from '@stores/appStoreProvider';
import {
  clearAllMetadataBooleanOverrides,
  getMetadataBooleanOverrides,
  type MetadataBooleanFlagKey,
  metadataBooleanFlagKeys,
  setMetadataBooleanOverride,
} from '@utils/metadataOverrides';

const useMetadataOverridesPanelStyles = makeStyles()((theme) => ({
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  flagLabel: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 500,
    margin: 0,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  flagLabelRow: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    gap: '8px',
    minWidth: 0,
  },
  flagList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '320px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  flagRow: {
    alignItems: 'center',
    borderRadius: theme.border.radius.medium.borderRadius,
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
    padding: '6px 8px',
  },
  flagRowOverridden: {
    backgroundColor: theme.palette.action.selected,
    boxShadow: `inset 3px 0 0 ${theme.palette.warning.main}`,
  },
  helperText: {
    color: theme.palette.text.secondary,
    fontSize: '12px',
    margin: 0,
  },
  input: {
    backgroundColor: theme.palette.background.default,
    border: '1px solid',
    borderColor: theme.palette.components.divider,
    borderRadius: theme.border.radius.medium.borderRadius,
    color: theme.palette.text.primary,
    font: 'inherit',
    padding: '10px 12px',
    width: '100%',
  },
  valuePill: {
    borderRadius: theme.border.radius.small.borderRadius,
    flexShrink: 0,
    fontSize: '10px',
    fontWeight: 600,
    lineHeight: 1.2,
    padding: '2px 6px',
    textTransform: 'lowercase',
  },
  valuePillFalse: {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.secondary,
  },
  valuePillTrue: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  valuePillUnknown: {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.secondary,
  },
}));

const getTriStateForKey = (
  key: MetadataBooleanFlagKey,
  overrides: ReturnType<typeof getMetadataBooleanOverrides>,
): TriStateValue => {
  if (!(key in overrides)) {
    return 'auto';
  }

  return overrides[key] ? 'on' : 'off';
};

interface MetadataOverridesPanelProps {
  onOverrideCountChange?: (count: number) => void;
}

const MetadataOverridesPanel = ({ onOverrideCountChange }: MetadataOverridesPanelProps) => {
  const applyLocalMetadataOverrides = useAppStore((state) => state.applyLocalMetadataOverrides);
  const metadata = useAppStore((state) => state.appMetadataState.data);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [overridesVersion, setOverridesVersion] = useState<number>(0);
  // Keys pinned to the top for the lifetime of this open panel. Seeded with the
  // flags already overridden when the panel opened, then accumulates any flag
  // the user overrides. Entries are never removed while open (so a flag set back
  // to Auto keeps its position); the set resets when the panel unmounts (closes).
  const [pinnedKeys, setPinnedKeys] = useState<Set<MetadataBooleanFlagKey>>(
    () => new Set(Object.keys(getMetadataBooleanOverrides()) as MetadataBooleanFlagKey[]),
  );

  const {
    classes: {
      fieldGroup,
      flagLabel,
      flagLabelRow,
      flagList,
      flagRow,
      flagRowOverridden,
      helperText,
      input,
      valuePill,
      valuePillFalse,
      valuePillTrue,
      valuePillUnknown,
    },
  } = useMetadataOverridesPanelStyles();

  const overrides = useMemo(
    () => getMetadataBooleanOverrides(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overridesVersion bumps after localStorage writes
    [overridesVersion],
  );

  const filteredFlagKeys = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchingKeys = normalizedQuery
      ? metadataBooleanFlagKeys.filter((key) => key.toLowerCase().includes(normalizedQuery))
      : metadataBooleanFlagKeys;

    // Surface pinned flags at the top; Array.sort is stable so each group keeps
    // its existing alphabetical order.
    return [...matchingKeys].sort((a, b) => {
      const aPinned = pinnedKeys.has(a);
      const bPinned = pinnedKeys.has(b);
      if (aPinned === bPinned) {
        return 0;
      }
      return aPinned ? -1 : 1;
    });
  }, [pinnedKeys, searchQuery]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTriStateChange = useCallback(
    (key: MetadataBooleanFlagKey, triState: TriStateValue) => {
      if (triState === 'auto') {
        setMetadataBooleanOverride(key, null);
      } else {
        setMetadataBooleanOverride(key, triState === 'on');
        setPinnedKeys((previous) => {
          if (previous.has(key)) {
            return previous;
          }
          const next = new Set(previous);
          next.add(key);
          return next;
        });
      }

      setOverridesVersion((version) => version + 1);
      applyLocalMetadataOverrides();
    },
    [applyLocalMetadataOverrides],
  );

  const handleResetAll = () => {
    clearAllMetadataBooleanOverrides();
    setOverridesVersion((version) => version + 1);
    applyLocalMetadataOverrides();
  };

  const overrideCount = Object.keys(overrides).length;

  useEffect(() => {
    onOverrideCountChange?.(overrideCount);
  }, [onOverrideCountChange, overrideCount]);

  return (
    <>
      <p className={helperText}>
        Toggle boolean metadata flags locally. Auto uses the backend value. Overrides are persisted
        in localStorage.
        {overrideCount > 0 ? ` ${overrideCount} override(s) active.` : ''}
      </p>

      <div className={fieldGroup}>
        <label htmlFor='metadata-overrides-search'>Search flags</label>
        <input
          className={input}
          id='metadata-overrides-search'
          onChange={handleSearchChange}
          placeholder='e.g. isCreativeLibraryEnabled'
          type='search'
          value={searchQuery}
        />
      </div>

      <div className={flagList}>
        {filteredFlagKeys.length === 0 ? (
          <p className={helperText}>No flags match your search.</p>
        ) : (
          filteredFlagKeys.map((key) => {
            const effectiveValue = metadata?.[key];
            const triState = getTriStateForKey(key, overrides);
            const isOverridden = triState !== 'auto';

            const effectiveBoolean =
              typeof effectiveValue === 'boolean' ? effectiveValue : undefined;
            let pillClassName = valuePillUnknown;
            if (effectiveBoolean === true) {
              pillClassName = valuePillTrue;
            } else if (effectiveBoolean === false) {
              pillClassName = valuePillFalse;
            }
            const pillLabel = effectiveBoolean === undefined ? 'n/a' : String(effectiveBoolean);

            return (
              <div className={`${flagRow}${isOverridden ? ` ${flagRowOverridden}` : ''}`} key={key}>
                <div className={flagLabelRow}>
                  <p className={flagLabel}>{key}</p>
                  <span
                    className={`${valuePill} ${pillClassName}`}
                    title={triState !== 'auto' ? 'Locally overridden' : 'Backend value'}>
                    {pillLabel}
                  </span>
                </div>
                <TriStateSwitch
                  onChange={(nextTriState) => handleTriStateChange(key, nextTriState)}
                  value={triState}
                />
              </div>
            );
          })
        )}
      </div>

      <Button onClick={handleResetAll} size='Small' variant='Standard'>
        Reset all overrides
      </Button>
    </>
  );
};

export default MetadataOverridesPanel;

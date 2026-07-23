import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Icon, TextInput, clsx } from '@rbx/foundation-ui';
import useFlag from '../utils/useFlag';
import { NUMBER_OVERRIDE_DRAFT_PATTERN, TEXT_OVERRIDE_COMMIT_DELAY_MS } from './constants';
import {
  commitTextOverride,
  formatValue,
  getOverrideDisplayValue,
  getTypedTextOverride,
  isBooleanFlagItem,
  isGroupFlagItem,
  isNumberInputKeyAllowed,
  isStaticFlagItem,
  isTextFlagItem,
  isUniverseFlagItem,
} from './flagUtils';
import { useLocalOverride } from './hooks';
import TriStateSwitch, { type OverrideState } from './TriStateSwitch';
import type {
  FlagItem,
  FlagMetadata,
  GroupFlagItem,
  OnOverrideChange,
  StaticFlagItem,
  TextFlagMetadata,
  UniverseFlagItem,
  WidgetProps,
} from './widgetTypes';

function getOverrideState(value: boolean | undefined): OverrideState {
  if (value === undefined) {
    return 'auto';
  }
  return value ? 'on' : 'off';
}

function BooleanOverrideControl({
  metadata,
  onOverrideChange,
}: {
  metadata: FlagMetadata<boolean, 'boolean'>;
  onOverrideChange: OnOverrideChange;
}) {
  const overrideValue = useLocalOverride(metadata);

  const onStateChange = useCallback(
    (state: OverrideState) => {
      if (state === 'auto') {
        window.rbxFlags.delete(metadata.namespace, metadata.name);
      } else {
        window.rbxFlags.set(metadata.namespace, metadata.name, state === 'on');
      }
      onOverrideChange(metadata);
    },
    [metadata, onOverrideChange],
  );

  return <TriStateSwitch value={getOverrideState(overrideValue)} onChange={onStateChange} />;
}

function TextOverrideControl({
  metadata,
  flagValue,
  onOverrideChange,
}: {
  metadata: TextFlagMetadata;
  flagValue: number | string | null;
  onOverrideChange: OnOverrideChange;
}) {
  const override = useLocalOverride(metadata);
  const typedOverride = getTypedTextOverride(override, metadata.valueType);
  const isOverridden = typedOverride !== undefined;
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(
    typedOverride === undefined ? formatValue(flagValue, metadata) : String(typedOverride),
  );
  const draftRef = useRef(draft);
  const metadataRef = useRef(metadata);
  const onOverrideChangeRef = useRef(onOverrideChange);
  const pendingCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The value the flag reverts to when the override is removed. It is only observable while no
  // override masks it, so we remember the last seen baseline and fall back to the default.
  const baselineRef = useRef<number | string | null>(
    typedOverride === undefined ? flagValue : null,
  );

  const getResetValue = useCallback(
    (): number | string => baselineRef.current ?? metadataRef.current.defaultValue,
    [],
  );

  const clearPendingCommit = useCallback(() => {
    if (pendingCommitRef.current !== null) {
      clearTimeout(pendingCommitRef.current);
      pendingCommitRef.current = null;
    }
  }, []);

  const commitDraft = useCallback(() => {
    clearPendingCommit();
    commitTextOverride(
      metadataRef.current,
      draftRef.current,
      getResetValue(),
      onOverrideChangeRef.current,
      true,
    );
  }, [clearPendingCommit, getResetValue]);

  const scheduleCommit = useCallback(
    (nextDraft: string) => {
      draftRef.current = nextDraft;
      clearPendingCommit();
      pendingCommitRef.current = setTimeout(() => {
        pendingCommitRef.current = null;
        commitTextOverride(
          metadataRef.current,
          draftRef.current,
          getResetValue(),
          onOverrideChangeRef.current,
        );
      }, TEXT_OVERRIDE_COMMIT_DELAY_MS);
    },
    [clearPendingCommit, getResetValue],
  );

  // Keep the debounced commit callback pointed at the latest row metadata and change handler.
  useEffect(() => {
    metadataRef.current = metadata;
    onOverrideChangeRef.current = onOverrideChange;
  }, [metadata, onOverrideChange]);

  // Track the flag's value while no override masks it; this is what a reset reverts to.
  useEffect(() => {
    if (typedOverride === undefined) {
      baselineRef.current = flagValue;
    }
  }, [flagValue, typedOverride]);

  // Refresh the visible draft when the backing flag value changes, but never while editing.
  useEffect(() => {
    if (isFocused) {
      return;
    }

    const nextDraft =
      typedOverride === undefined ? formatValue(flagValue, metadata) : String(typedOverride);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }, [flagValue, isFocused, metadata, typedOverride]);

  // Flush a pending debounced edit if this row unmounts before the timer fires.
  useEffect(
    () => () => {
      if (pendingCommitRef.current !== null) {
        clearTimeout(pendingCommitRef.current);
        commitTextOverride(
          metadataRef.current,
          draftRef.current,
          baselineRef.current ?? metadataRef.current.defaultValue,
          onOverrideChangeRef.current,
          true,
        );
      }
    },
    [],
  );

  const handleReset = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      clearPendingCommit();
      window.rbxFlags.delete(metadataRef.current.namespace, metadataRef.current.name);
      onOverrideChangeRef.current(metadataRef.current);
    },
    [clearPendingCommit],
  );

  const updateValue = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      if (metadata.valueType === 'number') {
        if (!NUMBER_OVERRIDE_DRAFT_PATTERN.test(nextValue)) {
          return;
        }
      }

      setDraft(nextValue);
      scheduleCommit(nextValue);
    },
    [metadata.valueType, scheduleCommit],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <TextInput
        size='Small'
        type={metadata.valueType === 'number' ? 'number' : 'text'}
        trailingIconNode={
          isOverridden ? (
            <motion.button
              type='button'
              title={`Reset value to ${formatValue(getResetValue(), metadata)}`}
              onClick={handleReset}
              aria-label={`Reset ${metadata.name} override`}
              initial={false}
              animate={{ opacity: 0.78, scale: 1 }}
              whileHover={{ opacity: 1, scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              className={clsx(
                'flex',
                'items-center',
                'justify-center',
                'cursor-pointer',
                'content-system-warning',
              )}
              style={{
                width: 20,
                height: 20,
                border: 'none',
                borderRadius: '50%',
                background: 'none',
                padding: 0,
              }}>
              <Icon name='icon-filled-circle-x' size='Small' />
            </motion.button>
          ) : undefined
        }
        value={draft}
        onChange={updateValue}
        onBlur={() => {
          commitDraft();
          setIsFocused(false);
        }}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commitDraft();
            event.currentTarget.blur();
            return;
          }

          if (metadata.valueType === 'number' && !isNumberInputKeyAllowed(event)) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          if (
            metadata.valueType === 'number' &&
            !NUMBER_OVERRIDE_DRAFT_PATTERN.test(event.clipboardData.getData('text'))
          ) {
            event.preventDefault();
          }
        }}
        inputMode={metadata.valueType === 'number' ? 'decimal' : undefined}
        step={metadata.valueType === 'number' ? 'any' : undefined}
        aria-label={`Override ${metadata.name}`}
      />
    </div>
  );
}

function FlagRowContent({
  item,
  flagValue,
  onOverrideChange,
}: {
  item: FlagItem;
  flagValue: unknown;
  onOverrideChange: OnOverrideChange;
}) {
  const { metadata } = item;
  const textFlagValue =
    typeof flagValue === 'number' || typeof flagValue === 'string' ? flagValue : null;
  const formattedFlagValue = formatValue(flagValue, metadata);

  return (
    <div
      data-list-item
      className={clsx(
        'flex',
        'justify-between',
        'items-center',
        'padding-xsmall',
        'gap-small',
        'radius-small',
      )}
      style={{ minHeight: 32 }}>
      <span
        title={`${metadata.name} / ${metadata.namespace}`}
        className={clsx('text-body-small', 'text-truncate-end', 'text-no-wrap')}
        style={{
          flex: isTextFlagItem(item) ? '0 1 45%' : 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
        {metadata.name}
      </span>
      {isBooleanFlagItem(item) && (
        <>
          <Icon
            name={flagValue === true ? 'icon-filled-check' : 'icon-filled-x-small'}
            size='Small'
            className={clsx(flagValue === true ? 'content-system-success' : 'content-system-alert')}
          />
          <BooleanOverrideControl metadata={item.metadata} onOverrideChange={onOverrideChange} />
        </>
      )}
      {isTextFlagItem(item) && (
        <TextOverrideControl
          metadata={item.metadata}
          flagValue={textFlagValue}
          onOverrideChange={onOverrideChange}
        />
      )}
      {!isBooleanFlagItem(item) && !isTextFlagItem(item) && (
        <span
          title={formattedFlagValue}
          className={clsx('text-body-small', 'content-muted', 'text-truncate-end')}
          style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          {formattedFlagValue}
        </span>
      )}
    </div>
  );
}

function StaticFlagRow({
  item,
  onOverrideChange,
}: {
  item: StaticFlagItem;
  onOverrideChange: OnOverrideChange;
}) {
  const { value } = useFlag(item.flag);
  return <FlagRowContent item={item} flagValue={value} onOverrideChange={onOverrideChange} />;
}

function UniverseFlagRow({
  item,
  universeId,
  onOverrideChange,
}: {
  item: UniverseFlagItem;
  universeId: number;
  onOverrideChange: OnOverrideChange;
}) {
  const { value } = useFlag(item.flag, { universeId });
  return <FlagRowContent item={item} flagValue={value} onOverrideChange={onOverrideChange} />;
}

function GroupFlagRow({
  item,
  groupId,
  onOverrideChange,
}: {
  item: GroupFlagItem;
  groupId: number;
  onOverrideChange: OnOverrideChange;
}) {
  const { value } = useFlag(item.flag, { groupId });
  return <FlagRowContent item={item} flagValue={value} onOverrideChange={onOverrideChange} />;
}

function MissingContextFlagRow({
  item,
  onOverrideChange,
}: {
  item: FlagItem;
  onOverrideChange: OnOverrideChange;
}) {
  const override = useLocalOverride(item.metadata);
  const value = getOverrideDisplayValue(item, override);
  return <FlagRowContent item={item} flagValue={value} onOverrideChange={onOverrideChange} />;
}

function FlagRow({
  item,
  contexts,
  onOverrideChange,
}: {
  item: FlagItem;
  contexts: WidgetProps['contexts'];
  onOverrideChange: OnOverrideChange;
}) {
  if (isUniverseFlagItem(item)) {
    if (typeof contexts?.universeId === 'number') {
      return (
        <UniverseFlagRow
          item={item}
          universeId={contexts.universeId}
          onOverrideChange={onOverrideChange}
        />
      );
    }
    return <MissingContextFlagRow item={item} onOverrideChange={onOverrideChange} />;
  }

  if (isGroupFlagItem(item)) {
    if (typeof contexts?.groupId === 'number') {
      return (
        <GroupFlagRow item={item} groupId={contexts.groupId} onOverrideChange={onOverrideChange} />
      );
    }
    return <MissingContextFlagRow item={item} onOverrideChange={onOverrideChange} />;
  }

  if (isStaticFlagItem(item)) {
    return <StaticFlagRow item={item} onOverrideChange={onOverrideChange} />;
  }

  return <MissingContextFlagRow item={item} onOverrideChange={onOverrideChange} />;
}

export default memo(FlagRow);

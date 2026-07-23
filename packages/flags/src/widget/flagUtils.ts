import type { KeyboardEvent } from 'react';
import { getOverride } from '../config/overrides';
import { NUMBER_OVERRIDE_ALLOWED_KEY_PATTERN } from './constants';
import type {
  FlagMetadata,
  FlagItem,
  GroupFlagItem,
  OnOverrideChange,
  StaticFlagItem,
  TextEditableFlagValueType,
  TextFlagMetadata,
  TextFlagItem,
  UniverseFlagItem,
  WidgetProps,
} from './widgetTypes';

export function sortFlagItems(flags: readonly FlagItem[]): FlagItem[] {
  return [...flags].sort((a, b) => {
    const namespaceComparison = a.metadata.namespace.localeCompare(b.metadata.namespace);
    return namespaceComparison === 0
      ? a.metadata.name.localeCompare(b.metadata.name)
      : namespaceComparison;
  });
}

export function formatEvaluationContext(contexts: WidgetProps['contexts']): string {
  const parts: string[] = [];
  if (contexts?.universeId !== undefined) {
    parts.push(`universe: ${contexts.universeId}`);
  }
  if (contexts?.groupId !== undefined) {
    parts.push(`group: ${contexts.groupId}`);
  }
  return parts.length > 0 ? parts.join(' | ') : 'No context';
}

export function getOverrideDisplayValue(item: FlagItem, override: unknown): unknown {
  const { metadata } = item;
  if (metadata.isValue?.(override)) {
    return override;
  }
  if (metadata.valueType === 'boolean' && typeof override === 'boolean') {
    return override;
  }
  if (metadata.valueType === 'number' && typeof override === 'number') {
    return override;
  }
  if (metadata.valueType === 'string' && typeof override === 'string') {
    return override;
  }
  return metadata.defaultValue;
}

export function getValidOverride(metadata: FlagMetadata, override: unknown): unknown {
  if (override === undefined) {
    return undefined;
  }
  if (metadata.isValue?.(override)) {
    return override;
  }
  if (metadata.valueType === 'boolean' && typeof override === 'boolean') {
    return override;
  }
  if (metadata.valueType === 'number' && typeof override === 'number') {
    return override;
  }
  if (metadata.valueType === 'string' && typeof override === 'string') {
    return override;
  }
  return undefined;
}

export async function evaluateFlagItem(
  item: FlagItem,
  contexts: WidgetProps['contexts'],
): Promise<unknown> {
  if (isUniverseFlagItem(item) && contexts?.universeId !== undefined) {
    return item.flag({ universeId: contexts.universeId });
  }
  if (isGroupFlagItem(item) && contexts?.groupId !== undefined) {
    return item.flag({ groupId: contexts.groupId });
  }
  if (isStaticFlagItem(item)) {
    return item.flag();
  }

  return getOverrideDisplayValue(item, getOverride(item.metadata.namespace, item.metadata.name));
}

export function isBooleanFlagItem(item: FlagItem): item is FlagItem<boolean, 'boolean'> {
  return item.metadata.valueType === 'boolean';
}

export function isStaticFlagItem(item: FlagItem): item is StaticFlagItem {
  return item.metadata.contextType === 'static';
}

export function isUniverseFlagItem(item: FlagItem): item is UniverseFlagItem {
  return item.metadata.contextType === 'universe';
}

export function isGroupFlagItem(item: FlagItem): item is GroupFlagItem {
  return item.metadata.contextType === 'group';
}

export function isTextFlagItem(item: FlagItem): item is TextFlagItem {
  return item.metadata.valueType === 'number' || item.metadata.valueType === 'string';
}

export function getTypedTextOverride(
  value: unknown,
  valueType: TextEditableFlagValueType,
): number | string | undefined {
  if (valueType === 'number' && typeof value === 'number') {
    return value;
  }
  if (valueType === 'string' && typeof value === 'string') {
    return value;
  }
  return undefined;
}

function stringifyFlagValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  const serialized = JSON.stringify(value);
  return serialized ?? String(value);
}

export function formatValue(value: unknown, metadata: FlagMetadata): string {
  if (value === null) {
    return stringifyFlagValue(metadata.defaultValue);
  }
  return stringifyFlagValue(value);
}

function isIncompleteNumberDraft(value: string, isFinalCommit: boolean): boolean {
  return (
    value === '-' || value === '.' || value === '-.' || (!isFinalCommit && value.endsWith('.'))
  );
}

function isNumberInputControlKey(event: KeyboardEvent<HTMLInputElement>): boolean {
  return event.metaKey || event.ctrlKey || event.altKey || event.key.length > 1;
}

export function isNumberInputKeyAllowed(event: KeyboardEvent<HTMLInputElement>): boolean {
  return isNumberInputControlKey(event) || NUMBER_OVERRIDE_ALLOWED_KEY_PATTERN.test(event.key);
}

function clearTextOverride(
  metadata: TextFlagMetadata,
  currentOverride: number | string | undefined,
  onOverrideChange: OnOverrideChange,
): void {
  if (currentOverride !== undefined) {
    window.rbxFlags.delete(metadata.namespace, metadata.name);
    onOverrideChange(metadata);
  }
}

export function commitTextOverride(
  metadata: TextFlagMetadata,
  value: string,
  resetValue: number | string,
  onOverrideChange: OnOverrideChange,
  isFinalCommit = false,
): void {
  const currentOverride = getTypedTextOverride(
    getOverride(metadata.namespace, metadata.name),
    metadata.valueType,
  );

  if (metadata.valueType === 'number') {
    if (value === '') {
      clearTextOverride(metadata, currentOverride, onOverrideChange);
      return;
    }

    if (isIncompleteNumberDraft(value, isFinalCommit)) {
      return;
    }

    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    // Matching the value the flag resets to should clear the override, not persist it.
    if (nextValue === resetValue) {
      clearTextOverride(metadata, currentOverride, onOverrideChange);
      return;
    }

    if (currentOverride === nextValue) {
      return;
    }

    window.rbxFlags.set(metadata.namespace, metadata.name, nextValue);
    onOverrideChange(metadata);
    return;
  }

  // Matching the value the flag resets to should clear the override, not persist it.
  if (value === resetValue) {
    clearTextOverride(metadata, currentOverride, onOverrideChange);
    return;
  }

  if (currentOverride === value) {
    return;
  }

  window.rbxFlags.set(metadata.namespace, metadata.name, value);
  onOverrideChange(metadata);
}

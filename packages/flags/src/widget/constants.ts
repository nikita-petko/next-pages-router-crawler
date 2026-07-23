import type { CSSProperties } from 'react';
import type { Position } from './widgetTypes';

export const POSITION_STORAGE_KEY = 'rbx-flags-widget-position';
export const COLLAPSED_SECTIONS_STORAGE_KEY = 'rbx-flags-widget-collapsed-sections';
export const RECENTLY_CHANGED_STORAGE_KEY = 'rbx-flags-widget-recently-changed';
export const RECENTLY_CHANGED_SECTION_KEY = '__recently_changed__';
export const MAX_RECENTLY_CHANGED = 10;
export const COLLAPSED_SIZE = 56;
export const DEFAULT_POSITION: Position = { x: 20, y: 60 };
export const TEXT_OVERRIDE_COMMIT_DELAY_MS = 250;
export const NUMBER_OVERRIDE_DRAFT_PATTERN = /^-?\d*\.?\d*$/;
export const NUMBER_OVERRIDE_ALLOWED_KEY_PATTERN = /^[\d.-]$/;
export const SEARCH_INPUT_CONTAINER_STYLE: CSSProperties = {
  boxShadow: 'none',
};

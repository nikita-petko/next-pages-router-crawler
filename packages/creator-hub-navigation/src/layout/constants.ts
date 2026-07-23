import type { TProductKey } from '../types';

export const PRIMARY_RAIL_GRID_AREA = 'rail';
export const HEADER_GRID_AREA = 'header';
export const CONTENT_GRID_AREA = 'content';

export const MAX_CONTENT_WIDTH = 1920;
export const PRIMARY_RAIL_WIDTH = 256;
export const PRIMARY_RAIL_COLLAPSE_WIDTH = 72;
export const PRIMARY_RAIL_DRAWER_Z_INDEX = 100;
// NOTE (@mbae, 2026-02-09): foundation-web-portal-zindex uses 1050 zIndex, which conflicts if we don't set this directly on the primaryRail
export const PRIMARY_RAIL_Z_INDEX = 1049;
export const TRANSITION_TIME = 200;
export const COMPACT_TRANSITION_DURATION = 150;
export const COLUMN_WIDTH = 190;

export const ASSISTANT_PRODUCTS: TProductKey[] = ['Documentation', 'Assistant'] as const;

export const REQUIRED_TRANSLATION_NAMESPACES = [
  'CreatorDashboard.Navigation',
  'CreatorDocumentation.Navigation',
  'CreatorDashboard.Controls',
  'CreatorDashboard.AssetTypes',
  'CreatorDocumentation.Search',
];

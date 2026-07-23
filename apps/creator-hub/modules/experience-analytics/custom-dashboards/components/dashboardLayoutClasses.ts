/** Shared Foundation Tailwind layout classes for dashboard body nodes. */
/** Figma node 2384-62450: 24px gaps in the workspace (`gap-xxlarge` = `--size-600`). */
export const DASHBOARD_BODY_STACK_CLASSES = 'flex flex-col gap-xxlarge width-full min-width-0';

export const DASHBOARD_BODY_GRID_ONE_COLUMN_CLASSES =
  'grid gap-xxlarge width-full min-width-0 [grid-template-columns:minmax(0,1fr)]';

export const DASHBOARD_BODY_GRID_TWO_COLUMN_CLASSES =
  'grid gap-xxlarge width-full min-width-0 [grid-template-columns:repeat(2,minmax(0,1fr))] max-[900px]:[grid-template-columns:minmax(0,1fr)]';

export const DASHBOARD_BODY_FLEX_CLASSES = 'flex flex-row wrap gap-xxlarge width-full min-width-0';

export const DASHBOARD_BODY_COMPONENT_NODE_CLASSES = 'min-width-0 width-full';

export const DASHBOARD_BODY_SUMMARY_COLLECTION_CLASSES =
  'flex flex-row wrap gap-xxlarge width-full min-width-0 items-start justify-start';

export const DASHBOARD_BODY_SUMMARY_COMPONENT_NODE_CLASSES = 'min-width-0 [width:217px]';

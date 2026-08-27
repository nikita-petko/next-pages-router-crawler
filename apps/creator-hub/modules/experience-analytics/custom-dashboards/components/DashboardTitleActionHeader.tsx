import type { FC, ReactNode } from 'react';

/**
 * Shared title + actions chrome for custom dashboard edit / view / preview.
 * Actions sit at the inline end on `medium` and up; they occupy their own
 * full-width row under that breakpoint (DSA-6148 / DSA-6150).
 *
 * Page chrome follows the locale direction. User-authored title text is
 * isolated so an RTL name cannot reorder the pencil into the action group
 * (DSA-6149).
 */
export const DASHBOARD_TITLE_ACTION_HEADER_ROW_CLASS =
  'flex flex-col medium:flex-row medium:items-start medium:justify-between gap-small width-full';

export const DASHBOARD_TITLE_ACTION_HEADER_TITLE_CLUSTER_CLASS =
  'flex items-start gap-small min-width-0 fill [unicode-bidi:isolate]';

export const DASHBOARD_TITLE_ACTION_HEADER_ACTIONS_CLASS =
  'flex flex-col items-stretch medium:items-end gap-xxsmall min-width-0 width-full medium:width-fit medium:shrink-0';

export const DASHBOARD_TITLE_ACTION_HEADER_ACTION_GROUP_CLASS =
  'flex wrap items-center gap-small width-full medium:width-fit medium:justify-end';

export const DASHBOARD_TITLE_TEXT_CLASS =
  'text-heading-large content-emphasis margin-none text-truncate-end min-width-0 max-width-full';

type DashboardTitleTextProps = {
  readonly children: ReactNode;
};

export const DashboardTitleText: FC<DashboardTitleTextProps> = ({ children }) => (
  <h1 className={DASHBOARD_TITLE_TEXT_CLASS}>
    <bdi>{children}</bdi>
  </h1>
);

type DashboardTitleActionHeaderProps = {
  readonly title: ReactNode;
  readonly actions: ReactNode;
  readonly leading?: ReactNode;
};

const DashboardTitleActionHeader: FC<DashboardTitleActionHeaderProps> = ({
  title,
  actions,
  leading,
}) => (
  <div className={DASHBOARD_TITLE_ACTION_HEADER_ROW_CLASS}>
    <div className={DASHBOARD_TITLE_ACTION_HEADER_TITLE_CLUSTER_CLASS}>
      {leading ? <div className='shrink-0'>{leading}</div> : null}
      <div className='flex flex-col gap-xxsmall min-width-0 fill'>{title}</div>
    </div>
    <div className={DASHBOARD_TITLE_ACTION_HEADER_ACTIONS_CLASS}>{actions}</div>
  </div>
);

export default DashboardTitleActionHeader;

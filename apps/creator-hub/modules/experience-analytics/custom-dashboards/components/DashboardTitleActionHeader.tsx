import type { FC, ReactNode } from 'react';

/**
 * Shared title + actions chrome for custom dashboard edit / view / preview.
 * Actions sit at the inline end on `medium` and up; they stack below the title
 * only under that breakpoint.
 */
export const DASHBOARD_TITLE_ACTION_HEADER_ROW_CLASS =
  'flex flex-col medium:flex-row medium:items-start medium:justify-between gap-small width-full';

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
    <div className='flex items-start gap-small min-width-0 grow'>
      {leading ? <div className='shrink-0'>{leading}</div> : null}
      <div className='flex flex-col gap-xxsmall min-width-0 grow'>{title}</div>
    </div>
    <div className='flex flex-col items-start medium:items-end gap-xxsmall min-width-0 shrink-0'>
      {actions}
    </div>
  </div>
);

export default DashboardTitleActionHeader;

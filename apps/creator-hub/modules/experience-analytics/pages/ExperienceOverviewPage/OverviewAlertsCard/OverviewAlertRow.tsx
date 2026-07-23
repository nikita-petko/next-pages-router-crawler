import type { FC, ReactNode } from 'react';
import { Link } from '@modules/miscellaneous/components';

export type OverviewAlertRowAction = {
  label: ReactNode;
  href: string;
  onClick?: () => void;
};

export type OverviewAlertRowProps = {
  /** Visual leading icon, typically a severity-colored `@rbx/ui` icon. */
  icon: ReactNode;
  /** Main row body text. */
  text: ReactNode;
  /** Optional inline action link rendered after the body text (e.g. "View chart"). */
  action?: OverviewAlertRowAction;
  /**
   * Compact relative-time label rendered on the right (e.g. "5m"). Omitted for
   * rows that don't carry a meaningful timestamp (the new-place-version row
   * per design).
   */
  timeAgo?: string;
  /** Used for stable test selectors. */
  testId?: string;
};

const OverviewAlertRow: FC<OverviewAlertRowProps> = ({ icon, text, action, timeAgo, testId }) => {
  return (
    <li className='flex items-start text-body-medium content-action-emphasis' data-testid={testId}>
      <span className='shrink-0 [margin-top:2px] padding-right-small'>{icon}</span>
      <div className='[flex:1] min-width-0 [overflow-wrap:break-word] padding-right-medium'>
        {text}
        {action ? (
          <>
            {' '}
            <Link
              className='[margin-left:4px] text-body-medium'
              color='inherit'
              underline='always'
              href={action.href}
              onClick={action.onClick}
              data-testid={testId === undefined ? undefined : `${testId}__action`}>
              {action.label}
            </Link>
          </>
        ) : null}
      </div>
      {timeAgo ? <div className='shrink-0 text-no-wrap'>{timeAgo}</div> : null}
    </li>
  );
};

export default OverviewAlertRow;

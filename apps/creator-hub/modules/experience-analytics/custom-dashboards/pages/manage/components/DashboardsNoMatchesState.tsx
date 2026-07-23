import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Filtered "no matches" composition. Lighter visual treatment than the
 * empty state — no illustration, Standard "Clear search" button — to
 * signal that the search input (not the dashboards list) is the source
 * of the zero-result situation
 * (`docs/custom-dashboards/pages/manage/page.md` §3.7.3).
 */
type DashboardsNoMatchesStateProps = {
  readonly onClearSearch: () => void;
};

const DashboardsNoMatchesState: FC<DashboardsNoMatchesStateProps> = ({ onClearSearch }) => {
  const t = useManagePageTranslations();
  return (
    // `<output>` exposes this as an implicit polite live region to screen
    // readers — when the search filter narrows the table to zero matches
    // the change is announced without stealing focus, matching the
    // search-as-you-type interaction model.
    <output
      aria-live='polite'
      className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small margin-none stroke-none bg-none width-full'>
      <p className='text-body-medium content-muted'>{t.noMatchesHeadline}</p>
      <Button variant='Standard' size='Small' onClick={onClearSearch}>
        {t.searchClearLabel}
      </Button>
    </output>
  );
};

export default DashboardsNoMatchesState;

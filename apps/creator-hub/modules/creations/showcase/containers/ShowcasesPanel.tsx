import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import LoadError from '@modules/miscellaneous/error/LoadError';
import ShowcaseCard from '../components/ShowcaseCard';
import ShowcasesEmptyState from '../components/ShowcasesEmptyState';
import { CREATE_SHOWCASE_ROUTE, buildManageShowcaseRoute } from '../constants';
import useShowcasesGate from '../hooks/useShowcasesGate';
import useShowcases from '../queries/useShowcases';

type ShowcasesPanelProps = {
  /** Showcases are authored by a community, so there is nothing to show for a personal creator. */
  groupId?: number;
};

const centered = 'flex grow-1 flex-col items-center justify-center self-stretch width-full';

const ShowcasesPanel = ({ groupId }: ShowcasesPanelProps) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const isShowcasesEnabled = useShowcasesGate();

  const { data: showcases, isPending, isError, refetch } = useShowcases(groupId);

  const goToCreate = useCallback(() => {
    void router.push(CREATE_SHOWCASE_ROUTE);
  }, [router]);

  const goToManage = useCallback(
    (showcaseId: string) => {
      void router.push(buildManageShowcaseRoute(showcaseId));
    },
    [router],
  );

  // The flag is still resolving; hold rather than flashing an empty state.
  if (isShowcasesEnabled === undefined) {
    return (
      <div className={centered}>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          size='Large'
          variant='Indeterminate'
        />
      </div>
    );
  }

  if (!isShowcasesEnabled) {
    return null;
  }

  if (isError) {
    return (
      <LoadError
        onReload={() => {
          void refetch();
        }}
      />
    );
  }

  if (isPending) {
    return (
      <div className={centered}>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          size='Large'
          variant='Indeterminate'
        />
      </div>
    );
  }

  if (!showcases || showcases.length === 0) {
    return (
      <div className={centered}>
        <ShowcasesEmptyState isCreateDisabled={!groupId} onCreateClick={goToCreate} />
      </div>
    );
  }

  return (
    <div className='grid [grid-template-columns:repeat(3,minmax(0,1fr))] gap-medium self-stretch width-full'>
      {showcases.map((showcase) => (
        <ShowcaseCard
          key={showcase.id}
          showcase={showcase}
          onManage={() => goToManage(showcase.id)}
        />
      ))}
    </div>
  );
};

export default ShowcasesPanel;

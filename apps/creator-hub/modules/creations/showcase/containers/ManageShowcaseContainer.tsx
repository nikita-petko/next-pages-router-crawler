import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import DeleteShowcaseDialog from '../components/DeleteShowcaseDialog';
import ManageShowcaseDetails from '../components/ManageShowcaseDetails';
import { SHOWCASES_LIST_ROUTE } from '../constants';
import useShowcasesGate from '../hooks/useShowcasesGate';
import useDeleteShowcase from '../queries/useDeleteShowcase';
import useShowcase from '../queries/useShowcase';
import useShowcasePublishQuota from '../queries/useShowcasePublishQuota';

const ManageShowcaseContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const isShowcasesEnabled = useShowcasesGate();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const rawId = router.query.id;
  const showcaseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const groupId = currentGroup?.id;

  const { data: showcase, isPending, isError, refetch } = useShowcase(showcaseId);
  const { data: quota } = useShowcasePublishQuota(groupId);
  const { mutate: deleteShowcase, isPending: isDeleting } = useDeleteShowcase(groupId);

  const handleDelete = useCallback(() => {
    if (showcaseId === undefined) {
      return;
    }
    deleteShowcase(showcaseId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        void router.push(SHOWCASES_LIST_ROUTE);
      },
    });
  }, [deleteShowcase, router, showcaseId]);

  // On a direct load `router.query` is empty until hydration, so reading the id any
  // earlier would flash a 404.
  if (isShowcasesEnabled === undefined || !router.isReady) {
    return <PageLoading />;
  }

  // Showcases are authored by a community (FR-C2.1), so a personal creator has no
  // route into this page.
  if (!isShowcasesEnabled || groupId === undefined || showcaseId === undefined) {
    return <PageNotFound />;
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
    return <PageLoading />;
  }

  // A missing showcase and one belonging to another community are the same answer
  // here: this creator has nothing to manage at this id.
  if (showcase === undefined || showcase.communityId !== groupId) {
    return <PageNotFound />;
  }

  return (
    <>
      <HubMeta
        title={buildTitle(showcase.title, translate('Heading.ManageShowcase'))}
        breadcrumb={buildBreadcrumb(
          translate('Heading.Creations'),
          translate('Label.AvatarItems'),
          translate('Label.Showcases'),
          showcase.title,
          translate('Heading.ManageShowcase'),
        )}
      />
      <div className='flex flex-col gap-xlarge padding-y-large'>
        <div className='flex items-center gap-small'>
          <span className='text-heading-large content-emphasis'>
            {translate('Heading.ManageShowcase')}
          </span>
          <Badge label={translate('Label.Showcase')} icon='icon-regular-image' variant='Standard' />
        </div>
        <ManageShowcaseDetails
          showcase={showcase}
          communityName={currentGroup?.name ?? ''}
          quota={quota}
          isDeleting={isDeleting}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      </div>
      <DeleteShowcaseDialog
        isOpen={isDeleteDialogOpen}
        showcaseTitle={showcase.title}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
};

export default ManageShowcaseContainer;

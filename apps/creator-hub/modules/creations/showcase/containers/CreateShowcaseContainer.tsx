import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation } from '@rbx/intl';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import CreateShowcaseForm from '../components/CreateShowcaseForm';
import ShowcaseItemPickerDialog from '../components/ShowcaseItemPickerDialog';
import { MAX_SHOWCASE_ITEMS, SHOWCASES_LIST_ROUTE } from '../constants';
import useShowcasesGate from '../hooks/useShowcasesGate';
import useCreateShowcase from '../queries/useCreateShowcase';
import useShowcasePublishQuota from '../queries/useShowcasePublishQuota';
import type { ShowcaseDraft, ShowcaseItem } from '../types';

const emptyDraft: ShowcaseDraft = {
  title: '',
  background: 'Plain',
  items: [],
  dynamicOrdering: true,
};

const CreateShowcaseContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const isShowcasesEnabled = useShowcasesGate();

  const [draft, setDraft] = useState<ShowcaseDraft>(emptyDraft);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const groupId = currentGroup?.id;
  const { data: quota } = useShowcasePublishQuota(groupId);
  const { mutate: createShowcase, isPending: isPublishing } = useCreateShowcase(groupId);

  const goToList = useCallback(() => {
    void router.push(SHOWCASES_LIST_ROUTE);
  }, [router]);

  const handlePublish = useCallback(() => {
    createShowcase(draft, { onSuccess: goToList });
  }, [createShowcase, draft, goToList]);

  const handleAddItems = useCallback((items: ShowcaseItem[]) => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, ...items].slice(0, MAX_SHOWCASE_ITEMS),
    }));
  }, []);

  if (isShowcasesEnabled === undefined) {
    return <PageLoading />;
  }

  // Showcases are authored by a community (FR-C2.1), so a personal creator has no
  // route into this page.
  if (!isShowcasesEnabled || groupId === undefined) {
    return <PageNotFound />;
  }

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Heading.CreateShowcase'))}
        breadcrumb={buildBreadcrumb(
          translate('Heading.Creations'),
          translate('Label.AvatarItems'),
          translate('Label.Showcases'),
          translate('Heading.CreateShowcase'),
        )}
      />
      <div className='flex flex-col gap-xlarge padding-y-large'>
        <span className='text-heading-large content-emphasis'>
          {translate('Heading.CreateShowcase')}
        </span>
        <CreateShowcaseForm
          draft={draft}
          onDraftChange={setDraft}
          communityName={currentGroup?.name ?? ''}
          hasCommunityCoverPhoto={false}
          quota={quota}
          isPublishing={isPublishing}
          onPublish={handlePublish}
          onCancel={goToList}
          onAddItem={() => setIsPickerOpen(true)}
        />
      </div>
      <ShowcaseItemPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAdd={handleAddItems}
        communityId={groupId}
        existingItems={draft.items}
      />
    </>
  );
};

export default CreateShowcaseContainer;

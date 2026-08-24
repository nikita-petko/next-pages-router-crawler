import { Button, TextInput, Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { ShowcaseDraft, ShowcasePublishQuota } from '../types';
import { canPublishShowcase } from '../utils/showcaseValidation';
import ShowcaseBackgroundSelector from './ShowcaseBackgroundSelector';
import ShowcaseFeaturedItems from './ShowcaseFeaturedItems';
import ShowcaseWidgetPreview from './ShowcaseWidgetPreview';

type CreateShowcaseFormProps = {
  draft: ShowcaseDraft;
  onDraftChange: (draft: ShowcaseDraft) => void;
  communityName: string;
  hasCommunityCoverPhoto: boolean;
  communityCoverPhotoUrl?: string;
  coverPhotoUploadHref?: string;
  quota?: ShowcasePublishQuota;
  isPublishing?: boolean;
  onPublish: () => void;
  onCancel: () => void;
  onAddItem?: () => void;
};

const CreateShowcaseForm = ({
  draft,
  onDraftChange,
  communityName,
  hasCommunityCoverPhoto,
  communityCoverPhotoUrl,
  coverPhotoUploadHref,
  quota,
  isPublishing = false,
  onPublish,
  onCancel,
  onAddItem,
}: CreateShowcaseFormProps) => {
  const { translate } = useTranslation();

  const hasQuotaRemaining = quota === undefined || quota.used < quota.limit;
  const canPublish = canPublishShowcase(draft) && hasQuotaRemaining && !isPublishing;

  return (
    <div className='flex wrap gap-xxlarge items-start self-stretch'>
      <div className='flex grow-1 flex-col gap-xlarge min-width-0 [max-width:643px]'>
        <TextInput
          id='showcase-title'
          size='Large'
          isRequired
          label={translate('Label.ShowcaseTitle')}
          placeholder={translate('Placeholder.ShowcaseTitle')}
          value={draft.title}
          onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
        />

        <ShowcaseBackgroundSelector
          value={draft.background}
          onChange={(background) => onDraftChange({ ...draft, background })}
          hasCommunityCoverPhoto={hasCommunityCoverPhoto}
          coverPhotoUploadHref={coverPhotoUploadHref}
        />

        <ShowcaseFeaturedItems items={draft.items} onAddItem={onAddItem} />

        {/* Per-viewer ordering (FR-C5) is still pending decision D2; kept as one
            self-contained row so it can be removed without touching the form. */}
        <div className='flex items-start gap-large self-stretch'>
          <div className='flex grow-1 flex-col gap-xxsmall min-width-0'>
            <span className='text-label-medium content-emphasis'>
              {translate('Label.ShowcaseDynamicOrdering')}
            </span>
            <span className='text-body-small content-muted'>
              {translate('Description.ShowcaseDynamicOrdering')}
            </span>
          </div>
          <Toggle
            size='Medium'
            placement='Start'
            aria-label={translate('Label.ShowcaseDynamicOrdering')}
            isChecked={draft.dynamicOrdering}
            onCheckedChange={(dynamicOrdering) => onDraftChange({ ...draft, dynamicOrdering })}
          />
        </div>

        <div className='flex flex-col gap-xsmall'>
          <div className='flex gap-small'>
            <Button
              variant='Emphasis'
              type='button'
              isDisabled={!canPublish}
              isLoading={isPublishing}
              onClick={onPublish}>
              {translate('Action.PublishShowcase')}
            </Button>
            <Button variant='Standard' type='button' onClick={onCancel}>
              {translate('Action.Cancel')}
            </Button>
          </div>
          {quota !== undefined && (
            <span className='text-body-small content-muted'>
              {translate('Description.ShowcasePublishQuota', {
                remaining: String(Math.max(0, quota.limit - quota.used)),
                limit: String(quota.limit),
              })}
            </span>
          )}
        </div>
      </div>

      <ShowcaseWidgetPreview
        communityName={communityName}
        title={draft.title}
        background={draft.background}
        items={draft.items}
        communityCoverPhotoUrl={communityCoverPhotoUrl}
      />
    </div>
  );
};

export default CreateShowcaseForm;

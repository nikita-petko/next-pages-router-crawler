import { Button, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { Showcase, ShowcasePublishQuota } from '../types';
import ShowcaseBackgroundSelector from './ShowcaseBackgroundSelector';
import ShowcaseFeaturedItems from './ShowcaseFeaturedItems';
import ShowcaseWidgetPreview from './ShowcaseWidgetPreview';

type ManageShowcaseDetailsProps = {
  showcase: Showcase;
  communityName: string;
  communityCoverPhotoUrl?: string;
  quota?: ShowcasePublishQuota;
  isDeleting?: boolean;
  onDelete: () => void;
};

/**
 * The published counterpart to CreateShowcaseForm. A published showcase is
 * immutable (FR-C3), so every field is read-only and taking it down is the only
 * action.
 */
const ManageShowcaseDetails = ({
  showcase,
  communityName,
  communityCoverPhotoUrl,
  quota,
  isDeleting = false,
  onDelete,
}: ManageShowcaseDetailsProps) => {
  const { translate } = useTranslation();

  return (
    <div className='flex wrap gap-xxlarge items-start self-stretch'>
      <div className='flex grow-1 flex-col gap-xlarge min-width-0 [max-width:643px]'>
        <TextInput
          id='showcase-title'
          size='Large'
          readOnly
          label={translate('Label.ShowcaseTitle')}
          value={showcase.title}
        />

        <ShowcaseBackgroundSelector isReadOnly value={showcase.background} />

        <ShowcaseFeaturedItems isReadOnly items={showcase.items} />

        <div className='flex flex-col gap-xsmall items-start'>
          <Button
            variant='Alert'
            type='button'
            isLoading={isDeleting}
            isDisabled={isDeleting}
            onClick={onDelete}>
            {translate('Action.DeleteShowcase')}
          </Button>
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
        title={showcase.title}
        background={showcase.background}
        items={showcase.items}
        communityCoverPhotoUrl={communityCoverPhotoUrl}
      />
    </div>
  );
};

export default ManageShowcaseDetails;

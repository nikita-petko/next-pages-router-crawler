import type { ChangeEvent, FC } from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MAX_MOMENT_DESCRIPTION_LENGTH } from '../constants/momentConstants';
import { useMomentVideoMedia } from '../hooks/useMomentVideoMedia';
import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import type { MomentMetadataUpdate } from '../utils/momentsLocalDraftStorage';
import { momentToExperienceStub, type MomentExperienceStub } from '../utils/momentToExperienceStub';
import MomentsExperiencePreview from './MomentsExperiencePreview';
import MomentsExperienceUrlInput from './MomentsExperienceUrlInput';
import MomentsVideoPreview from './MomentsVideoPreview';

type EditMomentDrawerProps = {
  moment: MomentCreation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMomentMetadataChange?: (momentId: string, updates: MomentMetadataUpdate) => void;
  onPublish?: (moment: MomentCreation) => void;
  onDelete?: (moment: MomentCreation) => void;
  publishingMomentId?: string | null;
  deletingMomentId?: string | null;
  isPublishDisabled?: boolean;
};

const EDIT_MOMENT_DESCRIPTION_INPUT_PROPS = { maxLength: MAX_MOMENT_DESCRIPTION_LENGTH };

function getInitialSelectedExperience(
  moment: MomentCreation,
): TExperience | MomentExperienceStub | undefined {
  const experience = momentToExperienceStub(moment);
  return experience.id > 0 || (experience.name?.length ?? 0) > 0 ? experience : undefined;
}

const EditMomentDrawer: FC<EditMomentDrawerProps> = ({
  moment,
  open,
  onOpenChange,
  onMomentMetadataChange,
  onPublish,
  onDelete,
  publishingMomentId = null,
  deletingMomentId = null,
  isPublishDisabled = false,
}) => {
  const { translate } = useTranslation();
  const [selectedExperience, setSelectedExperience] = useState<
    TExperience | MomentExperienceStub | undefined
  >(() => (moment ? getInitialSelectedExperience(moment) : undefined));
  const [description, setDescription] = useState(() => moment?.description ?? '');

  const hasLocalVideo =
    moment != null && 'hasLocalVideo' in moment && moment.hasLocalVideo === true;
  const mediaUrls = useMomentVideoMedia(moment?.id ?? '', {
    enabled: open && hasLocalVideo,
    thumbnailUrl: moment?.thumbnailUrl,
    videoUrl: moment?.videoUrl,
  });

  const handlePublish = useCallback(() => {
    if (!moment || isPublishDisabled || publishingMomentId != null) {
      return;
    }
    onPublish?.(moment);
  }, [isPublishDisabled, moment, onPublish, publishingMomentId]);

  const handleDelete = useCallback(() => {
    if (!moment || deletingMomentId === moment.id) {
      return;
    }
    onDelete?.(moment);
  }, [deletingMomentId, moment, onDelete]);

  const handleExperienceChange = useCallback(
    (experience: TExperience) => {
      if (!moment || !experience.id || !experience.name) {
        return;
      }

      setSelectedExperience(experience);
      onMomentMetadataChange?.(moment.id, {
        experienceId: experience.id,
        rootPlaceId: experience.rootPlaceId,
        experienceName: experience.name,
      });
    },
    [moment, onMomentMetadataChange],
  );

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDescription(event.target.value);
    },
    [],
  );

  const handleDescriptionBlur = useCallback(() => {
    if (!moment || description === moment.description) {
      return;
    }

    onMomentMetadataChange?.(moment.id, { description });
  }, [description, moment, onMomentMetadataChange]);

  if (!moment) {
    return null;
  }

  const isPublishingThisMoment = publishingMomentId === moment.id;
  const isPublishing = publishingMomentId != null;
  const isDeleting = deletingMomentId === moment.id;
  const isActive = moment.status === MomentCreationStatus.ACTIVE;
  const isDraft = moment.status === MomentCreationStatus.DRAFT;
  const isEditable = isDraft && !isPublishingThisMoment;
  const showPublish =
    !isActive && onPublish != null && ((isDraft && hasLocalVideo) || isPublishingThisMoment);
  const showDelete = onDelete != null;
  const isDescriptionAtMaxLength = description.length >= MAX_MOMENT_DESCRIPTION_LENGTH;

  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SheetContent closeLabel={translate('Action.Close')} largeScreenVariant='side'>
        <SheetTitle>
          {translate('Heading.EditMoment' /* TranslationNamespace.Creations */)}
        </SheetTitle>
        <SheetBody className='flex flex-col gap-y-medium padding-top-small padding-bottom-large'>
          <MomentsVideoPreview
            thumbnailUrl={mediaUrls?.thumbnailUrl ?? moment.thumbnailUrl}
            videoUrl={mediaUrls?.videoUrl ?? moment.videoUrl}
          />

          {isEditable ? (
            <>
              {selectedExperience ? (
                <MomentsExperiencePreview
                  experience={selectedExperience}
                  onChangeExperience={() => setSelectedExperience(undefined)}
                />
              ) : (
                <MomentsExperienceUrlInput onExperienceResolved={handleExperienceChange} />
              )}
            </>
          ) : selectedExperience ? (
            <div className='flex flex-col gap-y-xsmall width-full margin-top-small'>
              <span className='text-body-small content-muted'>
                {translate('CreateMomentModal.ExperienceInput.Label')}
              </span>
              <MomentsExperiencePreview experience={selectedExperience} hideTitle />
            </div>
          ) : null}

          <div className='flex flex-col gap-y-xsmall width-full padding-top-small'>
            {isEditable ? (
              <>
                <TextField
                  fullWidth
                  id={`edit-moment-description-${moment.id}`}
                  label={translate(
                    'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                  )}
                  minRows={3}
                  multiline
                  placeholder={translate(
                    'MomentsTable.Placeholders.Description' /* TranslationNamespace.Creations */,
                  )}
                  size='small'
                  value={description}
                  variant='outlined'
                  inputProps={EDIT_MOMENT_DESCRIPTION_INPUT_PROPS}
                  onBlur={handleDescriptionBlur}
                  onChange={handleDescriptionChange}
                />
                <span
                  aria-live='polite'
                  className={
                    isDescriptionAtMaxLength
                      ? 'text-body-small content-system-alert'
                      : 'text-body-small content-muted'
                  }
                  data-testid='edit-moment-description-char-count'>
                  {`${description.length}/${MAX_MOMENT_DESCRIPTION_LENGTH}`}
                </span>
              </>
            ) : (
              <>
                <span className='text-body-small content-muted'>
                  {translate(
                    'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                  )}
                </span>
                <span data-testid='edit-moment-description-readonly'>{description || '-'}</span>
              </>
            )}
          </div>
        </SheetBody>
        <SheetActions className='width-full'>
          <div className='flex gap-small width-full'>
            {showPublish ? (
              <Button
                variant='Emphasis'
                size='Medium'
                type='button'
                className='grow-1 basis-0 min-width-0'
                isDisabled={isPublishDisabled || isPublishing}
                isLoading={isPublishingThisMoment}
                onClick={handlePublish}>
                {translate('Action.Publish' /* TranslationNamespace.Creations */)}
              </Button>
            ) : null}
            {showDelete ? (
              <Button
                variant='Standard'
                size='Medium'
                type='button'
                className='grow-1 basis-0 min-width-0'
                isDisabled={isDeleting}
                isLoading={isDeleting}
                onClick={handleDelete}>
                <span className='content-action-alert'>
                  {translate('Action.Delete' /* TranslationNamespace.Controls */)}
                </span>
              </Button>
            ) : null}
          </div>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default withTranslation(EditMomentDrawer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);

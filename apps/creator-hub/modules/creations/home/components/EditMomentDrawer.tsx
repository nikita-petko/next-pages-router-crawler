import type { ChangeEvent, FC } from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  TextArea,
} from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MAX_MOMENT_DESCRIPTION_LENGTH } from '../constants/momentConstants';
import useMomentsUploadLanguageSelectEnabled from '../hooks/useMomentsUploadLanguageSelectEnabled';
import { useMomentVideoMedia } from '../hooks/useMomentVideoMedia';
import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import type { MomentMetadataUpdate } from '../utils/momentsLocalDraftStorage';
import {
  formatMomentContentLanguage,
  getDefaultMomentsUploadLocale,
} from '../utils/momentsUploadLocaleUtils';
import { momentToExperienceStub, type MomentExperienceStub } from '../utils/momentToExperienceStub';
import MomentsExperiencePreview from './MomentsExperiencePreview';
import MomentsExperienceUrlInput from './MomentsExperienceUrlInput';
import MomentsLanguageSelect from './MomentsLanguageSelect';
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
  const { locale: uiLocale } = useLocalization();
  const isLanguageSelectEnabled = useMomentsUploadLanguageSelectEnabled();
  const defaultLocale = getDefaultMomentsUploadLocale(uiLocale);
  const [selectedExperience, setSelectedExperience] = useState<
    TExperience | MomentExperienceStub | undefined
  >(() => (moment ? getInitialSelectedExperience(moment) : undefined));
  const [description, setDescription] = useState(() => moment?.description ?? '');
  const [localeOverride, setLocaleOverride] = useState<Locale | undefined>();
  const selectedLocale = localeOverride ?? moment?.locale ?? defaultLocale;

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

  const handleDescriptionChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  }, []);

  const handleLocaleChange = useCallback(
    (locale: Locale) => {
      setLocaleOverride(locale);
      if (!moment || locale === moment.locale) {
        return;
      }

      onMomentMetadataChange?.(moment.id, { locale });
    },
    [moment, onMomentMetadataChange],
  );

  const flushDescription = useCallback(() => {
    if (!moment || description === moment.description) {
      return;
    }

    onMomentMetadataChange?.(moment.id, { description });
  }, [description, moment, onMomentMetadataChange]);

  const handleDescriptionBlur = useCallback(() => {
    flushDescription();
  }, [flushDescription]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Overlay dismiss can skip input blur; persist pending edits on close.
        flushDescription();
      }
      onOpenChange(nextOpen);
    },
    [flushDescription, onOpenChange],
  );

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
    <SheetRoot open={open} onOpenChange={handleOpenChange}>
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

          {isLanguageSelectEnabled ? (
            <div className='flex flex-col gap-y-xsmall width-full padding-top-small'>
              {isEditable ? (
                <MomentsLanguageSelect
                  value={selectedLocale}
                  onChange={handleLocaleChange}
                  isDisabled={isPublishingThisMoment}
                />
              ) : (
                <>
                  <span className='text-body-small content-muted'>
                    {translate(
                      'CreateMomentModal.LanguageInput.Label' /* TranslationNamespace.Creations */,
                    )}
                  </span>
                  <span data-testid='edit-moment-content-language-readonly'>
                    {formatMomentContentLanguage(moment.locale)}
                  </span>
                </>
              )}
            </div>
          ) : null}

          <div className='flex flex-col gap-y-xsmall width-full padding-top-small'>
            {isEditable ? (
              <>
                <TextArea
                  id={`edit-moment-description-${moment.id}`}
                  label={translate(
                    'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                  )}
                  rows={3}
                  placeholder={translate(
                    'MomentsTable.Placeholders.Description' /* TranslationNamespace.Creations */,
                  )}
                  size='Small'
                  value={description}
                  maxLength={MAX_MOMENT_DESCRIPTION_LENGTH}
                  onBlur={handleDescriptionBlur}
                  onChange={handleDescriptionChange}
                />
                <span
                  aria-live='polite'
                  className={
                    isDescriptionAtMaxLength
                      ? 'text-body-small content-system-alert text-align-x-right'
                      : 'text-body-small content-muted text-align-x-right'
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

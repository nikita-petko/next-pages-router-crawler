import React, { useEffect } from 'react';
import experiencesDark from '@rbx/foundation-images/pictograms/video_game_dark.svg';
import experiencesLight from '@rbx/foundation-images/pictograms/video_game_light.svg';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ThemedImage from '@modules/miscellaneous/components/ThemedImage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';

type ShowcasedExperiencesDialogProps = {
  open: boolean;
  listingId: string;
  onClose: () => void;
};

const ShowcasedExperiencesDialog = ({
  open,
  listingId,
  onClose,
}: ShowcasedExperiencesDialogProps) => {
  const { logEvent } = useLicenseManagerLogger();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const title = tPendingTranslation(
    'Select showcased experiences',
    'Title of the dialog for selecting experiences to showcase on an IP listing',
    translationKey('Heading.SelectShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const description = tPendingTranslation(
    'Select up to 10 games to feature on this license listing. These will be highlighted to Creators browsing your IP.',
    'Description explaining how to select experiences for an IP listing showcase',
    translationKey('Description.ShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const emptyStateTitle = tPendingTranslation(
    'No licensed experiences yet',
    'Empty-state heading when an IP listing has no experiences with active license agreements',
    translationKey('Heading.NoLicensedExperiencesYet', TranslationNamespace.AgreementsManager),
  );
  const emptyStateDescription = tPendingTranslation(
    'No experiences are in active agreement with the licenses for this listing yet.',
    'Empty-state description when an IP listing has no experiences with active license agreements',
    translationKey('Description.NoLicensedExperiencesYet', TranslationNamespace.AgreementsManager),
  );
  const illustrationAlt = tPendingTranslation(
    'Game controller illustration',
    'Alternative text for the showcased experiences empty-state illustration',
    translationKey(
      'Label.ShowcasedExperiencesEmptyStateIllustration',
      TranslationNamespace.AgreementsManager,
    ),
  );
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));
  const saveLabel = tPendingTranslation(
    'Save selections',
    'Action to save selected experiences for an IP listing showcase',
    translationKey('Action.SaveSelections', TranslationNamespace.AgreementsManager),
  );

  useEffect(() => {
    if (open) {
      logEvent(
        LicenseManagerImpressionEvent.EmptyStateIphListingsDetailsPageNoLicensedExperiencesImpressionEvent,
        { listingId },
      );
    }
  }, [listingId, logEvent, open]);

  const handleCancel = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageCancelShowcasedExperiencesClickEvent, {
      listingId,
    });
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleSave = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageSaveShowcasedExperiencesClickEvent, {
      listingId,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance={false}>
      <DialogContent className='width-full'>
        <DialogBody className='flex flex-col gap-medium'>
          <div className='flex flex-col gap-xsmall'>
            <DialogTitle className='text-heading-small content-emphasis margin-none'>
              {title}
            </DialogTitle>
            <p className='text-body-medium content-default margin-none'>{description}</p>
          </div>
          <div className='flex width-full radius-medium stroke-standard stroke-default flex-col items-center justify-center padding-y-xxlarge padding-x-large'>
            <ThemedImage
              lightSrc={experiencesLight}
              darkSrc={experiencesDark}
              alt={illustrationAlt}
            />
            <div className='flex flex-col items-center gap-xsmall text-align-x-center max-width-[510px]'>
              <h2 className='text-heading-medium content-emphasis margin-none'>
                {emptyStateTitle}
              </h2>
              <p className='text-body-medium content-muted margin-none'>{emptyStateDescription}</p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className='flex gap-small justify-end'>
          <Button variant='Standard' size='Medium' onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button variant='Emphasis' size='Medium' onClick={handleSave} isDisabled>
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(ShowcasedExperiencesDialog, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
]);

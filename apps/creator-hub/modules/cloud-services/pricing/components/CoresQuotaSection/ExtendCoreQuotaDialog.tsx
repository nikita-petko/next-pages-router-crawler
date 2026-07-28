import { useEffect, useState, type FunctionComponent } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { CorePlace } from '../../hooks/useUniversePlacesForCores';
import { assertCoresPayload, dedupePlaceIds } from '../../utils/coresValidation';
import PlacesMultiSelect from './PlacesMultiSelect';

export type ExtendCoreQuotaDialogProps = {
  open: boolean;
  initialPlaceIds: number[];
  initialIsWholeExperience?: boolean;
  availablePlaces: CorePlace[];
  isLoadingPlaces?: boolean;
  onCancel: () => void;
  onConfirm: (placeIds: number[], isWholeExperience: boolean) => void;
};

const ExtendCoreQuotaDialog: FunctionComponent<ExtendCoreQuotaDialogProps> = ({
  open,
  initialPlaceIds,
  initialIsWholeExperience = false,
  availablePlaces,
  isLoadingPlaces,
  onCancel,
  onConfirm,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const [draftPlaceIds, setDraftPlaceIds] = useState<number[]>(() =>
    dedupePlaceIds(initialPlaceIds),
  );
  const [draftIsWholeExperience, setDraftIsWholeExperience] =
    useState<boolean>(initialIsWholeExperience);

  useEffect(() => {
    if (open) {
      setDraftPlaceIds(dedupePlaceIds(initialPlaceIds));
      setDraftIsWholeExperience(initialIsWholeExperience);
    }
  }, [open, initialPlaceIds, initialIsWholeExperience]);

  const handlePlacesChange = (nextIds: number[], nextIsWholeExperience: boolean) => {
    setDraftPlaceIds(nextIds);
    setDraftIsWholeExperience(nextIsWholeExperience);
  };

  const handleConfirm = () => {
    if (draftIsWholeExperience) {
      onConfirm([], true);
      return;
    }
    const next = dedupePlaceIds(draftPlaceIds);
    try {
      assertCoresPayload(next);
    } catch {
      return;
    }
    onConfirm(next, false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}>
      <DialogContent style={{ width: 480, maxWidth: '100%', boxSizing: 'border-box' }}>
        <DialogBody>
          <div className='flex flex-col min-width-0' style={{ gap: 16 }}>
            <div className='flex flex-col gap-medium'>
              <DialogTitle className='text-heading-small margin-y-none'>
                {translate(
                  translationKey('Title.ExtendCoreQuota', TranslationNamespace.CloudServices),
                )}
              </DialogTitle>
              <div className='text-body-medium content-muted'>
                {translate(
                  translationKey('Description.ExtendCoreQuota', TranslationNamespace.CloudServices),
                )}
              </div>
            </div>

            <div className='flex flex-col gap-small min-width-0'>
              <div className='text-title-medium content-emphasis'>
                {translate(translationKey('Label.Places', TranslationNamespace.CloudServices))}
              </div>
              <PlacesMultiSelect
                availablePlaces={availablePlaces}
                value={draftPlaceIds}
                isWholeExperience={draftIsWholeExperience}
                isDisabled={isLoadingPlaces}
                onChange={handlePlacesChange}
              />
            </div>
          </div>
        </DialogBody>
        <Divider />
        <DialogFooter>
          <div className='flex gap-small width-full padding-top-xlarge'>
            <Button
              className='fill'
              variant='Emphasis'
              size='Medium'
              onClick={handleConfirm}
              isDisabled={!draftIsWholeExperience && draftPlaceIds.length === 0}>
              {translate(translationKey('Label.ExtendQuota', TranslationNamespace.CloudServices))}
            </Button>
            <Button className='fill' variant='Standard' size='Medium' onClick={onCancel}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(ExtendCoreQuotaDialog, [TranslationNamespace.CloudServices]);

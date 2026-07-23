import type { FC } from 'react';
import { Button, Dialog, DialogBody, DialogContent, DialogTitle, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PublishingPermissionsRoute } from '../constants/audienceReachConstants';

interface ExpeditedIneligibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universeId: number;
  isRated: boolean;
  isAccountAllAgesTier: boolean;
}

const ExpeditedIneligibleDialog: FC<ExpeditedIneligibleDialogProps> = ({
  open,
  onOpenChange,
  universeId,
  isRated,
  isAccountAllAgesTier,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const requirementFulfilledIcon = (
    <Icon name='icon-regular-circle-check' size='Medium' className='content-system-success' />
  );
  const requirementNotMetIcon = (
    <Icon name='icon-regular-circle-x' size='Medium' className='content-system-alert' />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate(translationKey('Action.Close', TranslationNamespace.AudienceReach))}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-medium padding-large'>
          <DialogTitle className='text-heading-small margin-none'>
            {translate(
              translationKey('Heading.ExpeditedReviewModal', TranslationNamespace.AudienceReach),
            )}
          </DialogTitle>
          <p className='text-body-medium margin-none'>
            {translate(
              translationKey(
                'Description.IneligibleForExpediteModal',
                TranslationNamespace.AudienceReach,
              ),
            )}
          </p>
          <div className='flex flex-row items-center justify-between width-full'>
            <div className='flex flex-row items-center gap-medium'>
              {isAccountAllAgesTier ? requirementFulfilledIcon : requirementNotMetIcon}
              <p>
                {translate(
                  translationKey('Label.PublishToAllAges', TranslationNamespace.AudienceReach),
                )}
              </p>
            </div>
            <Button
              as='a'
              href={PublishingPermissionsRoute}
              size='Small'
              variant='Standard'
              isDisabled={isAccountAllAgesTier}>
              {isAccountAllAgesTier
                ? translate(translationKey('Action.Done', TranslationNamespace.AudienceReach))
                : translate(translationKey('Action.Manage', TranslationNamespace.AudienceReach))}
            </Button>
          </div>
          <div className='flex flex-row items-center justify-between width-full'>
            <div className='flex flex-row items-center gap-medium'>
              {isRated ? requirementFulfilledIcon : requirementNotMetIcon}
              <p>
                {translate(
                  translationKey('Label.HasAssignedRating', TranslationNamespace.AudienceReach),
                )}
              </p>
            </div>
            <Button
              as='a'
              href={`/dashboard/creations/experiences/${universeId}/experience-questionnaire`}
              size='Small'
              variant='Standard'
              isDisabled={isRated}>
              {isRated
                ? translate(translationKey('Action.Done', TranslationNamespace.AudienceReach))
                : translate(translationKey('Action.Manage', TranslationNamespace.AudienceReach))}
            </Button>
          </div>
          <Button
            variant='Standard'
            size='Medium'
            className='width-full'
            onClick={() => onOpenChange(false)}>
            {translate(translationKey('Action.Close', TranslationNamespace.AudienceReach))}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default ExpeditedIneligibleDialog;

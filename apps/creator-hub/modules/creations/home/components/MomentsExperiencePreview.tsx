import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type MomentsExperiencePreviewProps = {
  experience: TExperience;
  hideTitle?: boolean;
  onChangeExperience?: () => void;
};

const MomentsExperiencePreview: FC<MomentsExperiencePreviewProps> = ({
  experience,
  hideTitle = false,
  onChangeExperience,
}) => {
  const { translate } = useTranslation();

  return (
    <div className='flex flex-col gap-y-xsmall width-full'>
      {hideTitle ? null : (
        <div className='flex flex-row items-center justify-between'>
          <span className='text-body-small content-muted'>
            {translate('CreateMomentModal.Preview.Title')}
          </span>
          {onChangeExperience && (
            <Button variant='Link' size='Small' onClick={onChangeExperience}>
              {translate('Action.EEChange')}
            </Button>
          )}
        </div>
      )}
      <div className='padding-medium radius-medium bg-surface-200 width-full'>
        <ThumbnailWithNames
          disableLink
          target={experience}
          targetType='Experience'
          variant='medium'
        />
      </div>
    </div>
  );
};

export default withTranslation(MomentsExperiencePreview, [TranslationNamespace.Creations]);

import { Link, OptionSelector } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { ShowcaseBackground } from '../types';

type ShowcaseBackgroundSelectorProps = {
  value: ShowcaseBackground;
  onChange: (value: ShowcaseBackground) => void;
  /** When the community has no cover photo the option is unusable (FR-C2.3, D8). */
  hasCommunityCoverPhoto: boolean;
  coverPhotoUploadHref?: string;
};

/**
 * Foundation ships no OptionSelectorGroup, so the pair is composed by hand and
 * kept single-select here.
 */
const ShowcaseBackgroundSelector = ({
  value,
  onChange,
  hasCommunityCoverPhoto,
  coverPhotoUploadHref,
}: ShowcaseBackgroundSelectorProps) => {
  const { translate } = useTranslation();

  return (
    <div className='flex flex-col gap-small self-stretch'>
      <span className='text-heading-small content-emphasis'>
        {translate('Heading.ShowcaseBackground')}
      </span>
      <div className='flex gap-medium self-stretch' role='radiogroup'>
        <OptionSelector
          layout='Vertical'
          size='Medium'
          type='Checkmark'
          label={translate('Label.ShowcaseBackgroundPlain')}
          description={translate('Description.ShowcaseBackgroundPlain')}
          isSelected={value === 'Plain'}
          onSelect={() => onChange('Plain')}
        />
        <OptionSelector
          layout='Vertical'
          size='Medium'
          type='Checkmark'
          label={translate('Label.ShowcaseBackgroundCommunityCoverPhoto')}
          description={translate('Description.ShowcaseBackgroundCommunityCoverPhoto')}
          isSelected={value === 'CommunityCoverPhoto'}
          isDisabled={!hasCommunityCoverPhoto}
          onSelect={() => onChange('CommunityCoverPhoto')}
        />
      </div>
      {!hasCommunityCoverPhoto && (
        <span className='text-body-small content-muted'>
          {translate('Description.ShowcaseNoCoverPhoto')}{' '}
          {coverPhotoUploadHref !== undefined && (
            <Link href={coverPhotoUploadHref} target='_blank'>
              {translate('Action.UploadCoverPhoto')}
            </Link>
          )}
        </span>
      )}
    </div>
  );
};

export default ShowcaseBackgroundSelector;

import { Link, OptionSelector } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { ShowcaseBackground } from '../types';

type ShowcaseBackgroundSelectorProps = {
  value: ShowcaseBackground;
  onChange?: (value: ShowcaseBackground) => void;
  /** When the community has no cover photo the option is unusable (FR-C2.3, D8). */
  hasCommunityCoverPhoto?: boolean;
  coverPhotoUploadHref?: string;
  /**
   * A published showcase is immutable (FR-C3), so Manage renders only the chosen
   * background and drops the alternative entirely.
   */
  isReadOnly?: boolean;
};

const backgrounds: { value: ShowcaseBackground; labelKey: string; descriptionKey: string }[] = [
  {
    value: 'Plain',
    labelKey: 'Label.ShowcaseBackgroundPlain',
    descriptionKey: 'Description.ShowcaseBackgroundPlain',
  },
  {
    value: 'CommunityCoverPhoto',
    labelKey: 'Label.ShowcaseBackgroundCommunityCoverPhoto',
    descriptionKey: 'Description.ShowcaseBackgroundCommunityCoverPhoto',
  },
];

/**
 * Foundation ships no OptionSelectorGroup, so the pair is composed by hand and
 * kept single-select here.
 */
const ShowcaseBackgroundSelector = ({
  value,
  onChange,
  hasCommunityCoverPhoto = false,
  coverPhotoUploadHref,
  isReadOnly = false,
}: ShowcaseBackgroundSelectorProps) => {
  const { translate } = useTranslation();

  const options = isReadOnly
    ? backgrounds.filter((background) => background.value === value)
    : backgrounds;

  return (
    <div className='flex flex-col gap-small self-stretch'>
      <span className='text-heading-small content-emphasis'>
        {translate('Heading.ShowcaseBackground')}
      </span>
      <div
        className='flex gap-medium self-stretch'
        role={isReadOnly ? undefined : 'radiogroup'}
        aria-label={isReadOnly ? undefined : translate('Heading.ShowcaseBackground')}>
        {options.map((background) => (
          <OptionSelector
            key={background.value}
            layout='Vertical'
            size='Medium'
            type='Checkmark'
            label={translate(background.labelKey)}
            description={translate(background.descriptionKey)}
            isSelected={value === background.value}
            isDisabled={
              isReadOnly || (background.value === 'CommunityCoverPhoto' && !hasCommunityCoverPhoto)
            }
            // Required by Foundation even when the card is inert.
            onSelect={() => onChange?.(background.value)}
          />
        ))}
      </div>
      {!isReadOnly && !hasCommunityCoverPhoto && (
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

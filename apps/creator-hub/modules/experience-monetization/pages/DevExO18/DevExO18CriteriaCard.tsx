import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';

const DEVEX_O18_LEARN_MORE_URL =
  'https://create.roblox.com/docs/production/monetization/18-plus-devex-rate';

type DevExO18CriteriaCardProps = {
  isEligible: boolean;
};

function DevExO18CriteriaCard({ isEligible }: DevExO18CriteriaCardProps) {
  const { translate } = useTranslation();

  const title = translate('Heading.DevExO18ExperienceEligibility' /* TranslationNamespace.DevEx */);

  const description = isEligible
    ? translate(
        'Description.DevExO18ExperienceEligibilityEligible' /* TranslationNamespace.DevEx */,
      )
    : translate(
        'Description.DevExO18ExperienceEligibilityIneligible' /* TranslationNamespace.DevEx */,
      );

  const criteria = [
    {
      id: 'only-r15',
      iconName: 'icon-regular-person-standing',
      label: translate('Label.DevExO18CriteriaOnlyR15Avatars' /* TranslationNamespace.DevEx */),
    },
    {
      id: 'no-avatars',
      iconName: 'icon-regular-circle-slash',
      label: translate('Label.DevExO18CriteriaNoAvatars' /* TranslationNamespace.DevEx */),
    },
    {
      id: 'custom-non-human',
      iconName: 'icon-regular-parrot',
      label: translate(
        'Label.DevExO18CriteriaCustomNonHumanAvatars' /* TranslationNamespace.DevEx */,
      ),
    },
    {
      id: 'custom-human-r15',
      iconName: 'icon-regular-person-standing-gear',
      label: translate(
        'Label.DevExO18CriteriaCustomHumanR15Avatars' /* TranslationNamespace.DevEx */,
      ),
    },
  ] as const;

  return (
    <div
      className='flex flex-col gap-large radius-large padding-large stroke-standard stroke-default width-full height-full'
      data-testid='devex-o18-criteria-card'>
      <div className='flex flex-col gap-small'>
        <h2 className='content-emphasis margin-none text-heading-small'>{title}</h2>
        <div className='flex items-center gap-small'>
          {isEligible && (
            <Icon
              name='icon-filled-circle-check'
              className='content-system-success shrink-0 !size-800'
            />
          )}
          <p className='content-default margin-none text-body-medium'>{description}</p>
        </div>
      </div>
      <div className='flex flex-col gap-medium'>
        {criteria.map(({ id, iconName, label }) => (
          <div
            key={id}
            className='flex items-center gap-small content-default text-body-medium'
            data-testid={`devex-o18-criteria-${id}`}>
            <Icon name={iconName} size='Small' className='shrink-0' />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className='flex flex-col small:flex-row gap-medium'>
        {isEligible ? (
          <>
            <Button asChild variant='Emphasis' size='Medium' className='grow-1'>
              <a href={dashboard.getDevexUrl()}>
                {translate('Action.ViewDevExO18Balance' /* TranslationNamespace.DevEx */)}
              </a>
            </Button>
            <Button asChild variant='Standard' size='Medium' className='grow-1'>
              <a href={DEVEX_O18_LEARN_MORE_URL} target='_blank' rel='noreferrer'>
                {translate('Action.LearnMoreDevExO18' /* TranslationNamespace.DevEx */)}
              </a>
            </Button>
          </>
        ) : (
          <Button asChild variant='Emphasis' size='Medium' className='width-full'>
            <a href={DEVEX_O18_LEARN_MORE_URL} target='_blank' rel='noreferrer'>
              {translate('Action.LearnMoreDevExO18' /* TranslationNamespace.DevEx */)}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default DevExO18CriteriaCard;

import type { FC } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Audience } from '@modules/creations/common/audiences';
import { useGetUniverseConfiguration } from '@modules/react-query/develop';
import { ReachLevel } from '../types/audienceReach';

interface OverallReachCardProps {
  reachLevel: ReachLevel;
  universeId: number;
}

const OverallReachCard: FC<OverallReachCardProps> = ({ reachLevel, universeId }) => {
  const { translate } = useTranslation();
  const { data: universeConfig, isLoading: isUniverseConfigLoading } =
    useGetUniverseConfiguration(universeId);

  const audiences = universeConfig?.audiences;
  const isEditorsOnly = audiences?.length === 1 && audiences[0] === Audience.Editors;

  let valueLabel = undefined;
  if (!isUniverseConfigLoading) {
    if (isEditorsOnly) {
      valueLabel = translate('Label.Private');
    } else {
      switch (reachLevel) {
        case ReachLevel.PersonalUse:
          valueLabel = translate('Label.PersonalUse');
          break;
        case ReachLevel.Ages16PlusAndTrustedFriends:
          valueLabel = translate('Label.Ages16PlusAndTrustedFriends');
          break;
        case ReachLevel.Ages16Plus:
          valueLabel = translate('Label.Ages16Plus');
          break;
        case ReachLevel.Ages9Plus:
          valueLabel = translate('Label.Ages9Plus');
          break;
        case ReachLevel.AllAges:
        default:
          valueLabel = translate('Label.AllAges');
          break;
      }
    }
  }

  const description =
    reachLevel !== ReachLevel.PersonalUse && !isUniverseConfigLoading && !isEditorsOnly
      ? translate('Description.MaturityRestrictionsApply')
      : undefined;

  return (
    <div className='flex flex-col gap-xlarge padding-xxlarge radius-medium bg-surface-100'>
      <div>
        <div className='flex items-center'>
          <div className='flex flex-col gap-xsmall grow-1 shrink-1'>
            <span className='text-caption-large content-system-neutral padding-bottom-xsmall'>
              {translate('Heading.CurrentReach')}
            </span>
            <span className='flex items-center gap-medium'>
              <Icon name='icon-regular-person-with-smaller-person' size='XLarge' />
              <span className='text-heading-small'>{valueLabel}</span>
            </span>
          </div>
        </div>
        {description && (
          <div className='grow-0 shrink-0 width-full content-system-neutral'>
            <p className='text-body-medium margin-none padding-top-small'>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallReachCard;

import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import type { TShowMoreTile } from '../../constants/tileConstants';
import { ExperienceWithAnalyticsTileSize } from '../../constants/tileConstants';
import type { TExperienceInsight } from '../../hooks/useExperienceInsights';
import type { TExperience } from '../../providers/ExperienceProvider';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import ShowMoreCard from '../common/ShowMoreCard';
import ExperienceDataTileV2 from './ExperienceDataTileV2';

const { dashboard } = creatorHub;
type TExperienceTileProps = {
  data: (TExperience & { type: 'data' }) | TShowMoreTile;
  insight?: TExperienceInsight | null;
  isBeta?: boolean;
};

const isShowMore = (data: TExperienceTileProps['data']): data is TShowMoreTile =>
  data?.type === 'showMore';
const ExperienceTile: FunctionComponent<React.PropsWithChildren<TExperienceTileProps>> = ({
  data,
  insight,
  isBeta,
}) => {
  const { translate } = useTranslation();
  if (isShowMore(data)) {
    return (
      <ShowMoreCard
        onClick={() => captureHomepageEvent('clickTileViewAll', EHomepageSection.Experiences)}
        url={dashboard.getUrl()}
        width={ExperienceWithAnalyticsTileSize.small.width}
        isV2
        headerText={translate('Action.ViewAllExperiences')}
        descriptionText={translate('Action.ManageCreationsDashboard')}
      />
    );
  }
  return <ExperienceDataTileV2 data={data} insight={insight} isBeta={isBeta} />;
};

export default withTranslation(ExperienceTile, [TranslationNamespace.Home]);

import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { TExperience } from '@modules/home/providers/ExperienceProvider';
import ShowMoreCard from '../common/ShowMoreCard';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import { TShowMoreTile, ExperienceWithAnalyticsTileSize } from '../../constants/tileConstants';
import ExperienceDataTileV2 from './ExperienceDataTileV2';
import type { TExperienceInsight } from '../../hooks/useExperienceInsights';

const {
  creatorHub: { dashboard },
} = urls;
type TExperienceTileProps = {
  data: (TExperience & { type: 'data' }) | TShowMoreTile;
  insight?: TExperienceInsight | null;
  isBeta?: boolean;
};

const isShowMore = (data: TExperienceTileProps['data']): data is TShowMoreTile =>
  data?.type === 'showMore';
export const ExperienceTile: FunctionComponent<React.PropsWithChildren<TExperienceTileProps>> = ({
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

import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import getRouteToAvatarItemCreationsPage from '@modules/creations/avatarItem/utils/avatarMenuNavigationUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TShowMoreTile } from '../../constants/tileConstants';
import { AvatarItemWithAnalyticsTileSize } from '../../constants/tileConstants';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import ShowMoreCard from '../common/ShowMoreCard';
import type { TAvatarItemWithAnalyticsDataTileProps } from './AvatarItemWithAnalyticsDataTile';
import AvatarItemWithAnalyticsDataTile from './AvatarItemWithAnalyticsDataTile';

type TAvatarItemWithAnalyticsTileProps = {
  data: (TAvatarItemWithAnalyticsDataTileProps['data'] & { type: 'data' }) | TShowMoreTile;
};

const isShowMore = (data: TAvatarItemWithAnalyticsTileProps['data']): data is TShowMoreTile =>
  data?.type === 'showMore';

const AvatarItemWithAnalyticsTile: FunctionComponent<
  React.PropsWithChildren<TAvatarItemWithAnalyticsTileProps>
> = ({ data }) => {
  const { translate } = useTranslation();
  if (isShowMore(data)) {
    return (
      <ShowMoreCard
        onClick={() => captureHomepageEvent('clickTileViewAll', EHomepageSection.AvatarItems)}
        url={getRouteToAvatarItemCreationsPage()}
        width={AvatarItemWithAnalyticsTileSize.small.width}
        headerText={translate('Action.ViewAllAvatarItems')}
        descriptionText={translate('Action.ManageCreationsDashboard')}
      />
    );
  }
  return <AvatarItemWithAnalyticsDataTile data={data} />;
};

export default withTranslation(AvatarItemWithAnalyticsTile, [TranslationNamespace.Home]);

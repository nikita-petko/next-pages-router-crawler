import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls, Asset } from '@modules/miscellaneous/common';
import ShowMoreCard from '../common/ShowMoreCard';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import { AvatarItemWithAnalyticsTileSize, TShowMoreTile } from '../../constants/tileConstants';
import AvatarItemWithAnalyticsDataTile, {
  TAvatarItemWithAnalyticsDataTileProps,
} from './AvatarItemWithAnalyticsDataTile';

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
        url={urls.creatorHub.dashboard.getUrl(undefined, Asset.TShirt)}
        width={AvatarItemWithAnalyticsTileSize.small.width}
        headerText={translate('Action.ViewAllAvatarItems')}
        descriptionText={translate('Action.ManageCreationsDashboard')}
      />
    );
  }
  return <AvatarItemWithAnalyticsDataTile data={data} />;
};

export default withTranslation(AvatarItemWithAnalyticsTile, [TranslationNamespace.Home]);

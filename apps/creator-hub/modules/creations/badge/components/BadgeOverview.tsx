import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef, Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import type { ThumbnailRefreshRef } from '@rbx/thumbnails';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { Grid } from '@rbx/ui';
import type { GetBadgeByIdResponse } from '@modules/clients/badges';
import { Item } from '@modules/miscellaneous/common';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import useOverviewStyles from '../../common/components/Overview.styles';
import OverviewDescription from '../../common/components/OverviewDescription';
import OverviewInlineUrlTranslationLabel from '../../common/components/OverviewInlineUrlTranslationLabel';
import OverviewIsActiveLabel from '../../common/components/OverviewIsActiveLabel';
import OverviewItemTitleLabel from '../../common/components/OverviewItemTitleLabel';
import OverviewStats from '../../common/components/OverviewStats';
import OverviewTimeLabel from '../../common/components/OverviewTimeLabel';
import OverviewMetadataContainer from '../../common/containers/OverviewMetadataContainer';
import OverviewThumbnailContainer from '../../common/containers/OverviewThumbnailContainer';
import OverviewThumbnailMetadataContainer from '../../common/containers/OverviewThumbnailMetadataContainer';

export interface BadgeOverviewProps {
  badgeDetails: GetBadgeByIdResponse;
  isThumbnailRefreshRequired: boolean;
}

const Overview: FunctionComponent<React.PropsWithChildren<BadgeOverviewProps>> = ({
  badgeDetails,
  isThumbnailRefreshRequired,
}) => {
  const {
    classes: { overviewContainer },
  } = useOverviewStyles();

  const { translate } = useTranslation();
  const thumbnailRef = useRef<ThumbnailRefreshRef>(null);

  useEffect(() => {
    if (isThumbnailRefreshRequired) {
      thumbnailRef.current?.refreshThumbnail();
    }
  }, [isThumbnailRefreshRequired, thumbnailRef]);

  const url = useMemo(() => {
    return getUrlForItemType(Item.Game, badgeDetails?.awardingUniverse?.rootPlaceId ?? 0) || '';
  }, [badgeDetails]);

  return (
    <Grid container className={overviewContainer} spacing={2}>
      <OverviewThumbnailMetadataContainer>
        <OverviewThumbnailContainer
          ref={thumbnailRef}
          type={ThumbnailTypes.badgeIcon}
          targetId={badgeDetails.id ?? 0}
          alt={badgeDetails.name ?? ''}
        />

        <OverviewMetadataContainer
          headerMetadata={
            <>
              <OverviewItemTitleLabel itemName={badgeDetails.name ?? ''} />
              <br />
              <OverviewInlineUrlTranslationLabel
                translationKey='Label.EarnItemInGame'
                opening='gameLinkStart'
                closing='gameLinkEnd'
                anchorTargetName={badgeDetails.awardingUniverse?.name ?? ''}
                anchorTargetUrl={url}
              />
              <br />
              <OverviewIsActiveLabel
                isActive={badgeDetails.enabled ?? false}
                activeMessage={translate('Heading.Active')}
                inactiveMessage={translate('Heading.Inactive')}
              />
            </>
          }
          statistics={
            <>
              {badgeDetails.statistics?.awardedCount !== undefined && (
                <OverviewStats
                  statLabelName={translate('Heading.WonEver')}
                  statistic={badgeDetails.statistics?.awardedCount}
                />
              )}
              {badgeDetails.statistics?.pastDayAwardedCount !== undefined && (
                <OverviewStats
                  statLabelName={translate('Heading.WonYesterday')}
                  statistic={badgeDetails.statistics?.pastDayAwardedCount}
                />
              )}
              {badgeDetails.statistics?.winRatePercentage !== undefined && (
                <OverviewStats
                  options='percent'
                  statLabelName={translate('Heading.Rarity')}
                  statistic={badgeDetails.statistics?.winRatePercentage}
                />
              )}
            </>
          }
        />
      </OverviewThumbnailMetadataContainer>

      {badgeDetails.description && (
        <OverviewDescription
          heading={translate('Heading.Description')}
          descriptionText={badgeDetails.description}
        />
      )}

      {badgeDetails.created && (
        <OverviewTimeLabel heading={translate('Label.Created')} date={badgeDetails.created} />
      )}

      {badgeDetails.updated && (
        <OverviewTimeLabel heading={translate('Label.Updated')} date={badgeDetails.updated} />
      )}
    </Grid>
  );
};

export default Overview;

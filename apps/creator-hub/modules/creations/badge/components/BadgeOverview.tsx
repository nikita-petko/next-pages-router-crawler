import React, { FunctionComponent, useEffect, useMemo, useRef, Fragment } from 'react';
import { Grid } from '@rbx/ui';
import { ThumbnailTypes, ThumbnailRefreshRef } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import { Item, urls } from '@modules/miscellaneous/common';
import { GetBadgeByIdResponse } from '@modules/clients';

import {
  useOverviewStyles,
  OverviewStats,
  OverviewTimeLabel,
  OverviewIsActiveLabel,
  OverviewDescription,
  OverviewInlineUrlTranslationLabel,
  OverviewItemTitleLabel,
  OverviewThumbnailContainer,
  OverviewMetadataContainer,
  OverviewThumbnailMetadataContainer,
} from '@modules/creations/common';

const { getUrlForItemType } = urls;
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
            <Fragment>
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
            </Fragment>
          }
          statistics={
            <Fragment>
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
            </Fragment>
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

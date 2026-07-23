import React, { FunctionComponent } from 'react';
import { Button, SettingsIcon, CallMadeIcon, PostAddIcon, makeStyles } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { urls, utils } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AvatarItemDetail,
  AvatarItemTargetType,
  AvatarItemTypeToTargetType,
} from '@modules/clients/analytics';
import GetMarketplaceUrl from '@modules/avatar-analytics/components/GetMarketplaceUrl';
import { useCreator } from '../../providers/CreatorProvider';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import getAvatarItemConfigureUrl from './getAvatarItemConfigureUrl';

const { alpha } = utils;
const useStyles = makeStyles()((theme) => ({
  thumbnailHoverMenu: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    padding: 12,
    width: '100%',
    height: '100%',
    transition: '400ms',
    backgroundColor: alpha(theme.palette.common.black, 215),

    '&:hover, &:focus-within': {
      opacity: 1,
    },
  },
}));

export type TAvatarItemWithAnalyticsHoverMenuProps = {
  item: AvatarItemDetail;
};

const AvatarItemWithAnalyticsHoverMenu: FunctionComponent<
  React.PropsWithChildren<TAvatarItemWithAnalyticsHoverMenuProps>
> = ({ item }) => {
  const { translate } = useTranslation();
  const { permissions } = useCreator();
  const {
    classes: { thumbnailHoverMenu },
  } = useStyles();

  const targetType =
    (item.targetType && AvatarItemTypeToTargetType[item.targetType]) ??
    AvatarItemTargetType.AssetItem;

  return (
    <div className={thumbnailHoverMenu}>
      {permissions?.canManageAvatarItems && (
        <Button
          onClick={() =>
            captureHomepageEvent('clickConfigure', EHomepageSection.AvatarItems, {
              tileId: item.targetId?.toString() ?? '',
              type: targetType,
            })
          }
          color='primary'
          size='small'
          startIcon={<SettingsIcon />}
          href={getAvatarItemConfigureUrl(targetType, item.targetId ?? 0)}>
          {translate('Label.Configure')}
        </Button>
      )}
      <Button
        onClick={() =>
          captureHomepageEvent('clickViewOnRoblox', EHomepageSection.AvatarItems, {
            tileId: item.targetId?.toString() ?? '',
            type: targetType,
          })
        }
        color='primary'
        size='small'
        startIcon={<CallMadeIcon />}
        href={GetMarketplaceUrl(targetType, item.targetId ?? 0)}>
        {translate('Label.ViewOnRoblox')}
      </Button>
      {permissions?.canManageAvatarItems && (
        <Button
          onClick={() =>
            captureHomepageEvent('clickCreateAds', EHomepageSection.AvatarItems, {
              tileId: item.targetId?.toString() ?? '',
              type: targetType,
            })
          }
          color='primary'
          size='small'
          startIcon={<PostAddIcon />}
          href={urls.www.getSponsorAvatarItemsUrl()}>
          {translate('Label.CreateAd')}
        </Button>
      )}
    </div>
  );
};

export default withTranslation(AvatarItemWithAnalyticsHoverMenu, [TranslationNamespace.Home]);

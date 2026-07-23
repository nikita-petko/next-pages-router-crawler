/* eslint-disable @rbx/no-hardcoded-url -- /roadmap url is going to not be shown in Luobu */
import { useTranslation } from '@rbx/intl';
import {
  Link,
  Label,
  CodeIcon,
  TimelineOutlinedIcon,
  NotificationsIcon,
  PeopleOutlineOutlinedIcon,
  CloudQueueIcon,
  LocalMallOutlinedIcon,
  SecurityIcon,
  LocalAtmIcon,
  StraightenIcon,
  PublicIcon,
  BuildOutlinedIcon,
  BlurOnIcon,
  StorefrontIcon,
  VolumeUpIcon,
  HomeOutlinedIcon,
  SearchIcon,
  StorageIcon,
  TranslateOutlinedIcon,
  VoiceChatIcon,
} from '@rbx/ui';
import React, { ReactNode, useMemo, FunctionComponent } from 'react';
// TODO: Replace with `@rbx/ui` or `@rbx/foundation-ui` import — `SvgIcon` is not yet exported from either (`TIconProps` available in `@rbx/ui` for `SvgIconProps`)
// eslint-disable-next-line import/no-extraneous-dependencies -- icon is not in rbx/ui
import { SvgIcon as MuiSvgIcon, SvgIconProps as MuiSvgIconProps } from '@mui/material';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { ROAD_MAP_ASSET_BASE_PATH } from '../../constants/roadMapConstants';
import useRoadMapTileStyles from '../RoadMapTile.styles';
import { roadmapDetails, roadmapLinks } from './roadmapDetails';
import { RoadMapSubheadingData, RoadMapItemData, RoadMapTranslationsDatum } from './types';

const SpeedIcon: FunctionComponent<React.PropsWithChildren<MuiSvgIconProps>> = ({
  ref,
  ...props
}) => (
  <MuiSvgIcon {...props} ref={ref} viewBox='0 0 24 24'>
    <path d='M17.6895 6.26381L13.5168 14.6424C13.1412 15.4957 12.4944 16 11.7851 16C11.2009 16 10.7002 15.7285 10.4289 15.2824C10.1368 14.7587 10.1577 14.1187 10.5124 13.5756L15.9787 5.42983C16.2499 5.02254 16.8132 4.88677 17.2722 5.10012C17.7312 5.31346 17.8981 5.81772 17.6895 6.26381ZM19.15 8.68816C18.837 8.35844 18.2946 8.33905 17.919 8.64937C17.5643 8.94029 17.5435 9.44455 17.8773 9.79366C19.296 11.2289 20.0888 13.1102 20.0888 15.1078C20.0888 15.5539 20.4852 15.903 20.9442 15.903C21.4241 15.903 21.7997 15.5345 21.7997 15.1078C21.8205 12.7029 20.8817 10.4143 19.15 8.68816ZM12.5988 7.34991C13.0786 7.3887 13.475 7.07839 13.5168 6.63231C13.5585 6.18623 13.2247 5.81772 12.7448 5.77893C12.4736 5.75954 12.1815 5.74015 11.9103 5.74015C6.44397 5.74015 2 9.94882 2 15.1078C2 15.5539 2.39641 15.903 2.85541 15.903C3.31441 15.903 3.71082 15.5345 3.71082 15.1078C3.71082 10.8216 7.38284 7.33052 11.8894 7.33052C12.1398 7.31112 12.3901 7.33052 12.5988 7.34991Z' />
  </MuiSvgIcon>
);

export type RoadMapAccordionDetails = {
  title: string;
  content: string | ReactNode;
  image: string;
  Icon: React.ComponentType<{ classes?: { root?: string } }>;
  anchor?: string;
};

export type RoadMapSectionDetailsType = {
  title: string;
  description: string;
  accordionDetails?: RoadMapAccordionDetails[];
  comingSoonTime?: number;
};

const environmentDependentLinks = {
  cloudLink: `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud`,
  creatorStoreApiLink: `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/projects/assets/api#creator-store-api`,
  immersiveAdsLink: `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/immersive-ads`,
};

const links = { ...roadmapLinks, ...environmentDependentLinks };

type LinkKeys = keyof typeof links;

const List = (className: string) => ({
  opening: 'listStart',
  closing: 'listEnd',
  content(chunks: React.ReactNode) {
    return <ul className={className}>{chunks}</ul>;
  },
});

const ListItem = {
  opening: 'listItemStart',
  closing: 'listItemEnd',
  content(chunks: React.ReactNode) {
    return <li>{chunks}</li>;
  },
};

const Bold = {
  opening: 'boldStart',
  closing: 'boldEnd',
  content(chunks: React.ReactNode) {
    return <b>{chunks}</b>;
  },
};

const translateLink = (key: LinkKeys) => {
  return {
    opening: `${key}Start`,
    closing: `${key}End`,
    content(chunks: React.ReactNode) {
      return (
        <Link href={links[key]} target='_blank'>
          {chunks}
        </Link>
      );
    },
  };
};

const translatedLinks = Object.keys(links).map((key) => translateLink(key as LinkKeys));

const getIcon = (iconName: string): React.ComponentType<{ classes?: { root?: string } }> => {
  switch (iconName) {
    case 'HomeOutlinedIcon':
      return HomeOutlinedIcon;
    case 'CodeIcon':
      return CodeIcon;
    case 'TimelineOutlinedIcon':
      return TimelineOutlinedIcon;
    case 'NotificationsIcon':
      return NotificationsIcon;
    case 'PeopleOutlineOutlinedIcon':
      return PeopleOutlineOutlinedIcon;
    case 'CloudQueueIcon':
      return CloudQueueIcon;
    case 'LocalMallOutlinedIcon':
      return LocalMallOutlinedIcon;
    case 'SecurityIcon':
      return SecurityIcon;
    case 'LocalAtmIcon':
      return LocalAtmIcon;
    case 'StraightenIcon':
      return StraightenIcon;
    case 'PublicIcon':
      return PublicIcon;
    case 'BuildOutlinedIcon':
      return BuildOutlinedIcon;
    case 'BlurOnIcon':
      return BlurOnIcon;
    case 'StorefrontIcon':
      return StorefrontIcon;
    case 'VolumeUpIcon':
      return VolumeUpIcon;
    case 'SearchIcon':
      return SearchIcon;
    case 'StorageIcon':
      return StorageIcon;
    case 'TranslateOutlinedIcon':
      return TranslateOutlinedIcon;
    case 'VoiceChatIcon':
      return VoiceChatIcon;
    case 'SpeedIcon':
      return SpeedIcon;
    default:
      throw new Error(`Unknown icon name: ${iconName}. Import the icon from @rbx/ui.`);
  }
};

export default function useRoadMapTranslation() {
  const { ready, translate, translateHTML } = useTranslation();
  const {
    classes: { list, newLabel },
  } = useRoadMapTileStyles();

  const contentComponents = useMemo(() => {
    return [List(list), ListItem, Bold, ...translatedLinks];
  }, [list]);

  const roadMapDetails = useMemo(() => {
    return (Object.keys(roadmapDetails) as string[]).map((headingTranslKey: string) => {
      const record = roadmapDetails[headingTranslKey] as RoadMapTranslationsDatum;
      return {
        title: translate(headingTranslKey as string),
        description: translate(record.descriptionTranslKey),
        accordionDetails: record.subheadings.map((subheading: RoadMapSubheadingData) => {
          return {
            title: translate(subheading.translKey),
            image: `${ROAD_MAP_ASSET_BASE_PATH}/${subheading.assetFile}`,
            Icon: getIcon(subheading.IconName),
            content: (
              <ul className={list}>
                {subheading.items.map((item: RoadMapItemData) => {
                  return (
                    <li data-testid='roadmap-item' key={item.translKey}>
                      {item.isNew && (
                        <Label
                          className={newLabel}
                          labelText={translate('Label.NewUpperCase')}
                          severity='info'
                          variant='contained'
                        />
                      )}
                      {translateHTML(item.translKey, contentComponents)}
                    </li>
                  );
                })}
              </ul>
            ),
            anchor: subheading.translKey,
          };
        }),
      };
    });
  }, [translate, translateHTML, contentComponents, list, newLabel]);

  return { ready, roadMapDetails };
}
/* eslint-enable @rbx/no-hardcoded-url -- /roadmap url is going to not be shown in Luobu */

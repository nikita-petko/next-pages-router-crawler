import React from 'react';
import { BuilderChatSideIcon } from '@rbx/ui';
import { NavigationTypeRaw } from '../utilities/pageBuild/types/NavigationRaw';
import { DocumentationLuaType } from '../clients/docSiteSearchType';
import { TSearchListItem } from './types/SearchListItem';
import getPageIcon from './utils/getPageIcon';
import {
  SvgIconAssistant,
  SvgIconCreate,
  SvgIconLargePartBlock,
  SvgIconList,
  SvgIconPlayCircleOutlineFilled,
} from './searchIcons';

type SearchItemIconProps = {
  item: TSearchListItem;
};

const SearchItemIcon: React.FC<SearchItemIconProps> = ({ item }) => {
  switch (item.type) {
    case NavigationTypeRaw.Assistant:
      return <SvgIconAssistant />;
    case NavigationTypeRaw.CloudAPI:
    case NavigationTypeRaw.CloudAPI2:
    case NavigationTypeRaw.CloudLegacy:
    case NavigationTypeRaw.CloudFeature:
      return <SvgIconCreate />;
    case NavigationTypeRaw.EngineAPI:
      if (item.documentationSubType === DocumentationLuaType.Enum) {
        return <SvgIconList />;
      }
      return <SvgIconLargePartBlock />;
    case NavigationTypeRaw.EngineAPIMember:
      return <SvgIconLargePartBlock />;
    case NavigationTypeRaw.Forum:
      return <BuilderChatSideIcon />;
    case NavigationTypeRaw.Videos:
      return <SvgIconPlayCircleOutlineFilled />;
    case NavigationTypeRaw.Markdown:
    case NavigationTypeRaw.ReleaseNote:
    case NavigationTypeRaw.Lesson:
    default:
      return getPageIcon(item);
  }
};

export default SearchItemIcon;

import { creatorHub } from '@modules/miscellaneous/urls';
import {
  buildWithRobloxImage,
  browseStoreDarkImage,
  browseStoreLightImage,
} from './assetConstants';

const { creatorStore } = creatorHub;

export type TBeginnerToolData = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  buttonTextKey: string;
  link: string;
  getImgSrc: (theme: 'dark' | 'light') => string;
  imgAlt: string;
};

export const beginnerToolData: Array<TBeginnerToolData> = [
  {
    id: 'build-on-roblox',
    titleKey: 'Heading.BuildWithRoblox',
    descriptionKey: 'Description.BuildWithRoblox',
    buttonTextKey: 'Action.BuildWithRoblox',
    link: '/build',
    getImgSrc: () => buildWithRobloxImage,
    imgAlt: 'build with roblox',
  },
  {
    id: 'browse-store',
    titleKey: 'Heading.BrowseStore',
    descriptionKey: 'Description.BrowseStore',
    buttonTextKey: 'Action.ViewItems',
    link: creatorStore.getUrl(),
    getImgSrc: (themeMode) =>
      themeMode === 'light' ? browseStoreLightImage : browseStoreDarkImage,
    imgAlt: 'browse store',
  },
];

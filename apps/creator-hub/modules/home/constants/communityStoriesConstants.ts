import type { TYouTubePlayerProps } from '@modules/miscellaneous/common';
import { ASSET_BASE_PATH } from './assetConstants';

export const STORIES_ASSET_BASE_PATH = `${ASSET_BASE_PATH}/stories`;

export const COMMUNITY_STORIES_KEY = 'CreatorStories';
export const COMMUNITY_STORIES_LIST_ID = 'community-story-list';
export const youTubePlayerOptions: TYouTubePlayerProps['options'] = {
  playerVars: { controls: 0, rel: 0 },
};
export const eventNames = {
  joinCommunityForum: 'clickJoinCommunityForum',
  viewCommunityEvents: 'clickViewCommunityEvents',
  communityStory: 'clickCommunityStory',
};

export type TCommunityStory = {
  id: string;
  // * (@zwang, 04/25/24): the original order of the story, need this since it'll
  // * get shuffled when a featured story is picked randomly on mount, unlike an
  // * index, this starts with 1
  order: number;
  // * (@zwang, 04/24/24): the Youtube video id, taking from https://www.youtube.com/watch?v=<videoId>
  videoId: string;
};

export const communityStoriesData: Array<TCommunityStory> = [
  {
    id: 'Clemens',
    order: 1,
    videoId: 'VVkRx-nbOro',
  },
  {
    id: 'BadCC',
    order: 2,
    videoId: 't34-HEoZG1k',
  },
  {
    id: 'Jazzyx3',
    order: 3,
    videoId: 'jZ_x0OTO5Bw',
  },
  {
    id: 'YouFoundSam',
    order: 4,
    videoId: 'b8ulLh4LDVU',
  },
  {
    id: 'Morphist',
    order: 5,
    videoId: '9BN-QHtR4DQ',
  },
  {
    id: 'Lovespun',
    order: 6,
    videoId: 'H--Ij88TqSM',
  },
  {
    id: 'Riotfall',
    order: 7,
    videoId: 'S-Rx2fGfgB8',
  },
  {
    id: 'Jessica',
    order: 8,
    videoId: 'oFxXxJeUX2E',
  },
  {
    id: 'Blake',
    order: 9,
    videoId: 'hfweuRmw4aI',
  },
  {
    id: 'Sleitnick',
    order: 10,
    videoId: 'G9Wl0oexJ7c',
  },
];

export enum MediaType {
  Image = 'Image',
  Video = 'Video',
}

type Image = {
  type: MediaType.Image;
};

type Video = {
  type: MediaType.Video;
  videoTitle: string;
  videoHash: string;
};

// Media is a subset of RobloxApiDevelopModelsResponsePlaceMediaItemResponsegit
export type Media = {
  id: number; // id here is asset id
  type: MediaType;
  allowedToUse: boolean;
  altText?: string;
} & (Image | Video);

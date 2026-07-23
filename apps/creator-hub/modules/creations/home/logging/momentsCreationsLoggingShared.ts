export enum MomentsCreationsOperation {
  ListMoments = 'listMoments',
  FetchNextPage = 'fetchNextPage',
  UploadVideo = 'uploadVideo',
  ValidateVideo = 'validateVideo',
  PersistLocalVideo = 'persistLocalVideo',
  PublishMoment = 'publishMoment',
  DeleteMoment = 'deleteMoment',
  ResolveExperience = 'resolveExperience',
  LoadLocalVideoMedia = 'loadLocalVideoMedia',
  EnrichExperienceNames = 'enrichExperienceNames',
}

export type MomentsCreationsContext = {
  momentId?: string;
  experienceId?: number;
  placeId?: number;
  fileCount?: number;
  fileSize?: number;
  fileType?: string;
  reason?: string;
  inputValue?: string;
  idType?: string;
  matchedId?: number;
  userId?: number;
  pageCount?: number;
  momentCount?: number;
  persistedVideoCount?: number;
  isLocalMoment?: boolean;
  universeIdCount?: number;
};

const MAX_INPUT_VALUE_LENGTH = 200;

export const truncateMomentsCreationsInputValue = (value: string): string =>
  value.length <= MAX_INPUT_VALUE_LENGTH ? value : value.slice(0, MAX_INPUT_VALUE_LENGTH);

export const appendMomentsCreationsContextParameters = (
  parameters: Record<string, string>,
  context: MomentsCreationsContext,
): Record<string, string> => {
  if (context.momentId != null) {
    parameters.momentId = context.momentId;
  }

  if (context.experienceId != null) {
    parameters.experienceId = String(context.experienceId);
  }

  if (context.placeId != null) {
    parameters.placeId = String(context.placeId);
  }

  if (context.fileCount != null) {
    parameters.fileCount = String(context.fileCount);
  }

  if (context.fileSize != null) {
    parameters.fileSize = String(context.fileSize);
  }

  if (context.fileType != null && context.fileType.length > 0) {
    parameters.fileType = context.fileType;
  }

  if (context.inputValue != null && context.inputValue.length > 0) {
    parameters.inputValue = truncateMomentsCreationsInputValue(context.inputValue);
  }

  if (context.idType != null) {
    parameters.idType = context.idType;
  }

  if (context.matchedId != null) {
    parameters.matchedId = String(context.matchedId);
  }

  if (context.userId != null) {
    parameters.userId = String(context.userId);
  }

  if (context.pageCount != null) {
    parameters.pageCount = String(context.pageCount);
  }

  if (context.momentCount != null) {
    parameters.momentCount = String(context.momentCount);
  }

  if (context.persistedVideoCount != null) {
    parameters.persistedVideoCount = String(context.persistedVideoCount);
  }

  if (context.isLocalMoment != null) {
    parameters.isLocalMoment = String(context.isLocalMoment);
  }

  if (context.universeIdCount != null) {
    parameters.universeIdCount = String(context.universeIdCount);
  }

  return parameters;
};

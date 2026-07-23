import {
  BadgeImageStatus,
  DeveloperProductImageStatus,
  GamePassImageStatus,
} from '@modules/clients';
import ImageStatus from '../enums/ImageStatus';

export const getImageStatus = (
  state: GamePassImageStatus | BadgeImageStatus | DeveloperProductImageStatus,
) => {
  if (
    [
      GamePassImageStatus.Approved,
      BadgeImageStatus.Approved,
      DeveloperProductImageStatus.Approved,
    ].some((status) => state === status)
  ) {
    return ImageStatus.Approved;
  }
  if (
    [
      GamePassImageStatus.PendingReview,
      BadgeImageStatus.PendingReview,
      DeveloperProductImageStatus.PendingReview,
    ].some((status) => state === status)
  ) {
    return ImageStatus.PendingReview;
  }
  if (
    [
      GamePassImageStatus.Rejected,
      BadgeImageStatus.Rejected,
      DeveloperProductImageStatus.Rejected,
    ].some((status) => state === status)
  ) {
    return ImageStatus.Rejected;
  }
  if (
    [
      GamePassImageStatus.UnAvailable,
      BadgeImageStatus.UnAvailable,
      DeveloperProductImageStatus.UnAvailable,
    ].some((status) => state === status)
  ) {
    return ImageStatus.UnAvailable;
  }
  if (
    [GamePassImageStatus.Error, BadgeImageStatus.Error, DeveloperProductImageStatus.Error].some(
      (status) => state === status,
    )
  ) {
    return ImageStatus.Error;
  }
  return null;
};

export default getImageStatus;

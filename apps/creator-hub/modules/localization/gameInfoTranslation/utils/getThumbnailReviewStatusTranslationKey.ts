import { ThumbnailImageStatus } from '@modules/clients';

const getThumbnailReviewStatusTranslationKey = (state?: ThumbnailImageStatus) => {
  switch (state) {
    case ThumbnailImageStatus.Approved:
      return 'Label.Approved';
    case ThumbnailImageStatus.PendingReview:
      return 'Label.InReview';
    case ThumbnailImageStatus.Rejected:
      return 'Label.Rejected';
    case ThumbnailImageStatus.UnAvailable:
      return 'Label.Unavailable';
    case ThumbnailImageStatus.Error:
      return 'Label.Error';
    default:
      throw new Error('Invalid image status type');
  }
};

export default getThumbnailReviewStatusTranslationKey;

import { IconImageStatus } from '@modules/clients/gameInternationalization';

const getIconReviewStatusTranslationKey = (state?: IconImageStatus) => {
  switch (state) {
    case IconImageStatus.Approved:
      return '';
    case IconImageStatus.PendingReview:
      return 'Label.InReview';
    case IconImageStatus.Rejected:
      return 'Label.Rejected';
    case IconImageStatus.UnAvailable:
      return 'Label.Unavailable';
    case IconImageStatus.Error:
      return 'Label.Error';
    default:
      throw new Error('Invalid image status type');
  }
};

export default getIconReviewStatusTranslationKey;

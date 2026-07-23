import { useTranslation } from '@rbx/intl';
import ImageStatus from '../enums/ImageStatus';

const useGetImageStatusString = () => {
  const { translate } = useTranslation();
  const getImageStatusString = (imageStatus: ImageStatus) => {
    switch (imageStatus) {
      case ImageStatus.Approved:
        return '';
      case ImageStatus.Error:
        return translate('Label.Error');
      case ImageStatus.PendingReview:
        return translate('Label.InReview');
      case ImageStatus.Rejected:
        return translate('Label.Rejected');
      case ImageStatus.UnAvailable:
        return translate('Label.Unavailable');
      default:
        throw new Error('Invalid image status type');
    }
  };
  return { getImageStatusString };
};

export default useGetImageStatusString;

import { Alert } from '@rbx/foundation-ui';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GetEditCampaignDisabledTooltipText } from '@utils/campaignBuilder';

const EditCampaignBanner = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { mb4 },
  } = useCampaignBuilderCommonStyles();
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const bannerTextKey = GetEditCampaignDisabledTooltipText(flowType, campaignStatus);
  if (!bannerTextKey) {
    return null;
  }
  return (
    <Alert className={mb4} hasCloseAffordance={false} severity='Warning' variant='Feedback'>
      {translate(bannerTextKey)}
    </Alert>
  );
};

export default EditCampaignBanner;

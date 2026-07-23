import { Alert, AlertTitle } from '@rbx/ui';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GetEditCampaignDisabledTooltipText } from '@utils/campaignBuilder';

const EditCampaignBanner = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { banner, mb4 },
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
    <div className={`text-body-large ${banner}`}>
      <Alert className={mb4} severity='warning' variant='standard'>
        <AlertTitle>{translate(bannerTextKey)}</AlertTitle>
      </Alert>
    </div>
  );
};

export default EditCampaignBanner;

import { Alert, AlertTitle, Typography } from '@rbx/ui';

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
    <Typography className={banner} component='div'>
      <Alert className={mb4} severity='warning' variant='standard'>
        <AlertTitle>{translate(bannerTextKey)}</AlertTitle>
      </Alert>
    </Typography>
  );
};

export default EditCampaignBanner;

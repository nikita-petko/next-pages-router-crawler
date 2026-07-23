import { Icon, ProgressCircle } from '@rbx/foundation-ui';
import { Tooltip, Typography } from '@rbx/ui';
import { useFormContext } from 'react-hook-form';

import useAdvancedTargetingDrawerStyles from '@components/campaignBuilder/targeting/AdvancedTargetingDrawer.styles';
import { FlowTypes } from '@constants/campaignBuilder';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { HaveFormValuesChanged } from '@utils/advancedTargeting';
import { EstimateString } from '@utils/audienceEstimate';

interface AdvancedTargetingAudienceEstimateProps {
  isEstimateAvailable?: boolean;
}

const AdvancedTargetingAudienceEstimate = ({
  isEstimateAvailable = false,
}: AdvancedTargetingAudienceEstimateProps) => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      audienceEstimateInfoIcon,
      audienceEstimateOrLoadingContainer,
      audienceEstimateText,
      audienceEstimateWarningContainer,
      audienceEstimateWarningIcon,
    },
  } = useAdvancedTargetingDrawerStyles();

  const audienceEstimateState = useCampaignBuilderStore((state) => state.audienceEstimationContext);
  const detailedTargetingMatchType = useCampaignBuilderStore(
    (state) => state.detailedTargetingMatchType,
  );

  const { getValues } = useFormContext<AdvancedTargetingFormType>();

  const editMode = useCampaignBuilderStore((state) => state.flowType === FlowTypes.EDIT);
  if (editMode) {
    return null;
  }

  const maybeRenderWarning = () => {
    if (!isEstimateAvailable || !HaveFormValuesChanged(getValues)) {
      return null;
    }
    return (
      <div className={audienceEstimateWarningContainer}>
        <Icon
          className={`${audienceEstimateWarningIcon} content-system-warning`}
          name='icon-regular-triangle-exclamation'
          size='Small'
        />
        <Typography className={audienceEstimateText} variant='body2'>
          {translateCampaign('Description.ManualTargetingLimitedAudience')}
        </Typography>
      </div>
    );
  };

  const loadingSpinner = (
    <ProgressCircle
      ariaLabel={translateMisc('Label.Loading')}
      size='Medium'
      variant='Indeterminate'
    />
  );

  const renderEstimateOrLoading = () => {
    if (!isEstimateAvailable) {
      return (
        <div className={audienceEstimateOrLoadingContainer}>
          <Typography className={audienceEstimateText} variant='h1'>
            {UNAVAILABLE_VALUE_DISPLAY}
          </Typography>
        </div>
      );
    }

    const audienceEstimate = audienceEstimateState.estimates[detailedTargetingMatchType];

    if (!audienceEstimate) {
      return <div className={audienceEstimateOrLoadingContainer}>{loadingSpinner}</div>;
    }
    let child = null;
    if (audienceEstimate.isError) {
      child = (
        <Typography className={audienceEstimateText} color='error' variant='body2'>
          {translateCampaign('Message.FailedToLoadAudienceEstimate')}
        </Typography>
      );
    } else if (audienceEstimate.isLoading) {
      child = loadingSpinner;
    } else {
      child = (
        <Typography className={audienceEstimateText} variant='h1'>
          {EstimateString({
            est: audienceEstimate.data?.estimate_audience_num || 0,
            lessThan1KLabel: translateCampaign('Label.LessThan1K'),
            lowerBound: audienceEstimate.data?.estimate_audience_lower_bound || 0,
            upperBound: audienceEstimate.data?.estimate_audience_upper_bound || 0,
          })}
        </Typography>
      );
    }
    return <div className={audienceEstimateOrLoadingContainer}>{child}</div>;
  };

  return (
    <div>
      <Typography color='secondary' variant='body2'>
        {translateCampaign('Heading.AudienceSizeEstimate')}
      </Typography>
      <Tooltip title={translateCampaign('Description.AudienceSizeEstimateTooltip')}>
        <Icon className={audienceEstimateInfoIcon} name='icon-regular-circle-i' size='Small' />
      </Tooltip>
      {renderEstimateOrLoading()}
      {maybeRenderWarning()}
    </div>
  );
};

export default AdvancedTargetingAudienceEstimate;

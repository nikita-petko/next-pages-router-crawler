import { Icon, ProgressCircle } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
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
        <span className={`text-body-medium ${audienceEstimateText}`}>
          {translateCampaign('Description.ManualTargetingLimitedAudience')}
        </span>
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
          <span className={`text-heading-large ${audienceEstimateText}`}>
            {UNAVAILABLE_VALUE_DISPLAY}
          </span>
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
        <span className={`text-body-medium content-system-alert ${audienceEstimateText}`}>
          {translateCampaign('Message.FailedToLoadAudienceEstimate')}
        </span>
      );
    } else if (audienceEstimate.isLoading) {
      child = loadingSpinner;
    } else {
      child = (
        <span className={`text-heading-large ${audienceEstimateText}`}>
          {EstimateString({
            est: audienceEstimate.data?.estimate_audience_num || 0,
            lessThan1KLabel: translateCampaign('Label.LessThan1K'),
            lowerBound: audienceEstimate.data?.estimate_audience_lower_bound || 0,
            upperBound: audienceEstimate.data?.estimate_audience_upper_bound || 0,
          })}
        </span>
      );
    }
    return <div className={audienceEstimateOrLoadingContainer}>{child}</div>;
  };

  return (
    <div>
      <span className='text-body-medium content-default'>
        {translateCampaign('Heading.AudienceSizeEstimate')}
      </span>
      <Tooltip title={translateCampaign('Description.AudienceSizeEstimateTooltip')}>
        <Icon className={audienceEstimateInfoIcon} name='icon-regular-circle-i' size='Small' />
      </Tooltip>
      {renderEstimateOrLoading()}
      {maybeRenderWarning()}
    </div>
  );
};

export default AdvancedTargetingAudienceEstimate;

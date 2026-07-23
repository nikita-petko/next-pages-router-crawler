import { Toggle } from '@rbx/foundation-ui';
import { UseFormSetValue, UseFormTrigger } from 'react-hook-form';

import {
  applyOffPlatformSpendFormValues,
  applyOnPlatformSpendFormValues,
} from '@components/campaignBuilder/common/objectiveHelpers';
import useSpendObjectivePlatformToggleStyles from '@components/campaignBuilder/common/SpendObjectivePlatformToggle.styles';
import { ServerCampaignObjectiveType, ServerDetailedTargetingMatchType } from '@constants/campaign';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { GetRecommendationResponse } from '@type/campaignBuilder';
import { ResetFormRecommendations } from '@utils/campaignBuilder';

interface SpendObjectivePlatformToggleProps {
  detailedTargetingMatchType: ServerDetailedTargetingMatchType;
  hasPaymentProfile: boolean;
  isAdAccountAutoCreateEnabled?: boolean;
  isExtendToOffPlatformEnabled: boolean;
  offPlatformRequestMinimumDaysFromStartDate: number;
  offPlatformRequestMinimumDurationDays: number;
  offPlatformRequestMinimumLifetimeBudgetMicroUsd: number;
  recommendation: GetRecommendationResponse;
  setValue: UseFormSetValue<FormType>;
  shouldShowCreditCard: boolean;
  shouldShowInvoice: boolean;
  trigger: UseFormTrigger<FormType>;
}

const SpendObjectivePlatformToggle = ({
  detailedTargetingMatchType,
  hasPaymentProfile,
  isAdAccountAutoCreateEnabled,
  isExtendToOffPlatformEnabled,
  offPlatformRequestMinimumDaysFromStartDate,
  offPlatformRequestMinimumDurationDays,
  offPlatformRequestMinimumLifetimeBudgetMicroUsd,
  recommendation,
  setValue,
  shouldShowCreditCard,
  shouldShowInvoice,
  trigger,
}: SpendObjectivePlatformToggleProps) => {
  const {
    classes: { container },
  } = useSpendObjectivePlatformToggleStyles();

  return (
    <div className={container}>
      <Toggle
        aria-label='Toggle platform type'
        data-testid='platform-toggle-switch'
        isChecked={isExtendToOffPlatformEnabled}
        onCheckedChange={() => {
          if (!isExtendToOffPlatformEnabled) {
            applyOffPlatformSpendFormValues({
              offPlatformRequestMinimumDaysFromStartDate,
              offPlatformRequestMinimumDurationDays,
              offPlatformRequestMinimumLifetimeBudgetMicroUsd,
              setValue,
            });
            ResetFormRecommendations({
              detailedTargetingMatchType,
              isAdAccountAutoCreateEnabled,
              isExtendToOffPlatformEnabled: true,
              objective: ServerCampaignObjectiveType.SPEND,
              recommendation,
              setValue,
            });
          } else {
            applyOnPlatformSpendFormValues({
              hasPaymentProfile,
              setValue,
              shouldShowCreditCard,
              shouldShowInvoice,
            });
            ResetFormRecommendations({
              detailedTargetingMatchType,
              isAdAccountAutoCreateEnabled,
              isExtendToOffPlatformEnabled: false,
              objective: ServerCampaignObjectiveType.SPEND,
              recommendation,
              setValue,
            });
          }
          trigger();
        }}
        placement='Start'
        size='Small'
      />
      <span className='text-body-medium'>
        {isExtendToOffPlatformEnabled ? 'Off Platform' : 'On Platform'}
      </span>
    </div>
  );
};

export default SpendObjectivePlatformToggle;

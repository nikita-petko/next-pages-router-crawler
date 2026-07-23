import type { FC } from 'react';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum PublishingFeeDialogErrorState {
  None = 'None',
  Unknown = 'Unknown',
  InsufficientFunds = 'InsufficientFunds',
}

interface PublishingFeeDialogErrorBannerProps {
  error: PublishingFeeDialogErrorState;
}

const PublishingFeeDialogErrorBanner: FC<PublishingFeeDialogErrorBannerProps> = ({ error }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  switch (error) {
    case PublishingFeeDialogErrorState.None:
      return undefined;
    case PublishingFeeDialogErrorState.InsufficientFunds:
      return (
        <FeedbackBanner
          title={translate(
            translationKey('Heading.InsufficientRobux', TranslationNamespace.AudienceReach),
          )}
          description={translate(
            translationKey('Description.InsufficientRobux', TranslationNamespace.AudienceReach),
          )}
          variant='Emphasis'
          severity='Error'
          layout='Stacked'
          actions={
            <Button
              as='a'
              href={`https://${process.env.robloxSiteDomain}/upgrades/robux`}
              variant='Standard'
              size='Small'
              className='width-fit'>
              {translate(translationKey('Action.GetMoreRobux', TranslationNamespace.AudienceReach))}
            </Button>
          }
        />
      );
    case PublishingFeeDialogErrorState.Unknown:
    default:
      return (
        <FeedbackBanner
          title={translate(
            translationKey('Heading.PaymentFailed', TranslationNamespace.AudienceReach),
          )}
          description={translate(
            translationKey('Description.PaymentFailed', TranslationNamespace.AudienceReach),
          )}
          variant='Emphasis'
          severity='Error'
          layout='Stacked'
        />
      );
  }
};

export default PublishingFeeDialogErrorBanner;

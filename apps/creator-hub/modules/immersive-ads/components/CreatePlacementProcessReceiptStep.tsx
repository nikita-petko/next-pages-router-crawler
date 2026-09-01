import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ProcessReceiptCodeSnippet from './ProcessReceiptCodeSnippet';

interface CreatePlacementProcessReceiptStepProps {
  productIds: number[];
}

const CreatePlacementProcessReceiptStep = ({
  productIds,
}: CreatePlacementProcessReceiptStepProps) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <div className='flex flex-col gap-large'>
      <p className='text-body-large content-muted margin-none padding-y-small'>
        {translate(
          translationKey('Description.ProcessReceipt', TranslationNamespace.ImmersiveAdsAnalytics),
        )}
      </p>
      <ProcessReceiptCodeSnippet productIds={productIds} />
    </div>
  );
};

export default withTranslation(CreatePlacementProcessReceiptStep, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

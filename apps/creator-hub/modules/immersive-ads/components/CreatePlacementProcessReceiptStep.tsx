import { Fragment, useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import usePlayWithRewardStyles from './PlayWithReward.styles';

interface CreatePlacementProcessReceiptStepProps {
  productIds: number[];
}

const buildCodeSnippet = (productIds: number[]) => {
  const constLines = productIds.map((id, i) => `local DEV_PRODUCT_ID_${i + 1} = ${id}`).join('\n');
  const ifChain = productIds
    .map((_, i) =>
      [
        `  ${i === 0 ? 'if' : 'elseif'} receiptInfo.ProductId == DEV_PRODUCT_ID_${i + 1} then`,
        `    -- TODO: Give the reward and store in user's inventory`,
        `    return Enum.ProductPurchaseDecision.PurchaseGranted`,
      ].join('\n'),
    )
    .join('\n');
  const constSection = constLines ? `${constLines}\n` : '';
  const ifSection = ifChain ? `\n${ifChain}\n  end\n` : '';
  return `${constSection}MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end
${ifSection}  return Enum.ProductPurchaseDecision.NotProcessedYet
end`;
};

const CreatePlacementProcessReceiptStep = ({
  productIds,
}: CreatePlacementProcessReceiptStepProps) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    classes: {
      codeWrapper,
      codeBlock,
      codeHeader,
      codeHeaderContentContainer,
      codeSnippetComment,
      codeSnippetParameter,
      codeSnippetValue,
      codeSnippetVariable,
      prewrap,
    },
  } = usePlayWithRewardStyles();

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(buildCodeSnippet(productIds)).catch(() => {});
  }, [productIds]);

  const tab = <span className={prewrap}>{'  '}</span>;
  const newLine = <span className={prewrap}>{'\n'}</span>;

  return (
    <div className='flex flex-col gap-large'>
      <p className='text-body-large content-muted margin-none padding-y-small'>
        {translate(
          translationKey('Description.ProcessReceipt', TranslationNamespace.ImmersiveAdsAnalytics),
        )}
      </p>

      {/* Code snippet */}
      <div>
        <div className={codeHeader}>
          <div className={codeHeaderContentContainer}>
            <p className='text-body-medium margin-none'>
              {translate(
                translationKey(
                  'Label.ServerSideScript',
                  TranslationNamespace.ImmersiveAdsAnalytics,
                ),
              )}
            </p>
            <Button
              variant='Utility'
              size='Small'
              icon='icon-regular-two-stacked-squares'
              onClick={handleCopyToClipboard}>
              {translate(translationKey('Label.Copy', TranslationNamespace.ImmersiveAdsAnalytics))}
            </Button>
          </div>
        </div>

        {/* oxlint-disable rbx/no-hardcoded-translation-string -- renders Lua source code */}
        <div className={codeBlock}>
          {/* DEV_PRODUCT_ID_N constants */}
          {productIds.map((id, i) => (
            <p key={id} className={codeWrapper}>
              <span className={codeSnippetVariable}>local</span>
              <span>{` DEV_PRODUCT_ID_${i + 1} = `}</span>
              <span className={codeSnippetParameter}>{id}</span>
            </p>
          ))}

          {productIds.length > 0 && newLine}
          <p className={codeWrapper}>
            <span>MarketplaceService.</span>
            <span className={codeSnippetParameter}>ProcessReceipt</span>
            <span>&nbsp;= function(receiptInfo)</span>
          </p>
          <p className={codeWrapper}>
            {tab}
            <span className={codeSnippetVariable}>local</span>
            <span> player = Players:</span>
            <span className={codeSnippetParameter}>GetPlayerByUserId</span>
            <span>(receiptInfo.</span>
            <span className={codeSnippetParameter}>PlayerId</span>
            <span>)</span>
          </p>

          {newLine}
          <p className={codeWrapper}>
            {tab}
            <span className={codeSnippetVariable}>if not</span>
            <span> player </span>
            <span className={codeSnippetVariable}>then</span>
          </p>
          <p className={codeWrapper}>
            {tab}
            {tab}
            <span className={codeSnippetVariable}>return </span>
            <span className={codeSnippetParameter}>
              Enum.ProductPurchaseDecision.NotProcessedYet
            </span>
          </p>
          <p className={codeWrapper}>
            {tab}
            <span className={codeSnippetVariable}>end</span>
          </p>

          {productIds.length > 0 && newLine}
          {/* if-elseif chain */}
          {productIds.map((_, i) => (
            <Fragment key={productIds[i]}>
              <p className={codeWrapper}>
                {tab}
                <span className={codeSnippetVariable}>{i === 0 ? 'if ' : 'elseif '}</span>
                <span>receiptInfo.</span>
                <span className={codeSnippetParameter}>ProductId</span>
                <span>{` == DEV_PRODUCT_ID_${i + 1} `}</span>
                <span className={codeSnippetVariable}>then</span>
              </p>
              <p className={codeWrapper}>
                <span className={codeSnippetComment}>
                  {tab}
                  {tab}
                  <span>{'-- '}</span>
                  <span className={codeSnippetValue}>TODO: </span>
                  <span>Give the reward and store in user&apos;s inventory</span>
                </span>
              </p>
              <p className={codeWrapper}>
                {tab}
                {tab}
                <span className={codeSnippetVariable}>return </span>
                <span className={codeSnippetParameter}>
                  Enum.ProductPurchaseDecision.PurchaseGranted
                </span>
              </p>
            </Fragment>
          ))}
          {productIds.length > 0 && (
            <p className={codeWrapper}>
              {tab}
              <span className={codeSnippetVariable}>end</span>
            </p>
          )}

          {newLine}
          <p className={codeWrapper}>
            {tab}
            <span className={codeSnippetVariable}>return </span>
            <span className={codeSnippetParameter}>
              Enum.ProductPurchaseDecision.NotProcessedYet
            </span>
          </p>
          <p className={codeWrapper}>
            <span className={codeSnippetVariable}>end</span>
          </p>
        </div>
        {/* oxlint-enable rbx/no-hardcoded-translation-string */}
      </div>
    </div>
  );
};

export default withTranslation(CreatePlacementProcessReceiptStep, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

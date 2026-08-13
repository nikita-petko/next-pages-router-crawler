import { Fragment, useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface ProcessReceiptCodeSnippetProps {
  productIds: number[];
}

const CODE_LINE_CLASS_NAME = 'text-body-small content-muted margin-none';
const CODE_VARIABLE_CLASS_NAME = 'content-system-alert';
const CODE_PARAMETER_CLASS_NAME = 'content-system-warning';

export const buildProcessReceiptCodeSnippet = (productIds: number[]) => {
  const constLines = productIds.map((id, index) => `local DEV_PRODUCT_ID_${index + 1} = ${id}`);
  const ifChain = productIds.map((_, index) => [
    `  ${index === 0 ? 'if' : 'elseif'} receiptInfo.ProductId == DEV_PRODUCT_ID_${index + 1} then`,
    `    -- TODO: Give the reward and store in user's inventory`,
    `    return Enum.ProductPurchaseDecision.PurchaseGranted`,
  ]);
  const constSection = constLines.length > 0 ? `${constLines.join('\n')}\n` : '';
  const ifSection = ifChain.length > 0 ? `\n${ifChain.flat().join('\n')}\n  end\n` : '';

  return `${constSection}MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end
${ifSection}  return Enum.ProductPurchaseDecision.NotProcessedYet
end`;
};

const ProcessReceiptCodeSnippet = ({ productIds }: ProcessReceiptCodeSnippetProps) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(buildProcessReceiptCodeSnippet(productIds)).catch(() => {});
  }, [productIds]);

  const tab = <span className='[white-space:pre-wrap]'>{'  '}</span>;
  const newLine = <span className='[white-space:pre-wrap]'>{'\n'}</span>;

  return (
    <div>
      <div className='bg-surface-100 content-muted padding-y-xxsmall padding-x-small stroke-thin stroke-muted [border-radius:var(--radius-medium)_var(--radius-medium)_0_0]'>
        <div className='flex items-center justify-between self-stretch'>
          <p className='text-body-medium margin-none'>
            {translate(
              translationKey('Label.ServerSideScript', TranslationNamespace.ImmersiveAdsAnalytics),
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
      <div className='bg-surface-300 padding-small stroke-thin stroke-muted max-height-[280px] [overflow-y:auto] [border-radius:0_0_var(--radius-medium)_var(--radius-medium)] [font-family:monospace]'>
        {productIds.map((id, index) => (
          <p key={id} className={CODE_LINE_CLASS_NAME}>
            <span className={CODE_VARIABLE_CLASS_NAME}>local</span>
            <span>{` DEV_PRODUCT_ID_${index + 1} = `}</span>
            <span className={CODE_PARAMETER_CLASS_NAME}>{id}</span>
          </p>
        ))}

        {productIds.length > 0 && newLine}
        <p className={CODE_LINE_CLASS_NAME}>
          <span>MarketplaceService.</span>
          <span className={CODE_PARAMETER_CLASS_NAME}>ProcessReceipt</span>
          <span>&nbsp;= function(receiptInfo)</span>
        </p>
        <p className={CODE_LINE_CLASS_NAME}>
          {tab}
          <span className={CODE_VARIABLE_CLASS_NAME}>local</span>
          <span> player = Players:</span>
          <span className={CODE_PARAMETER_CLASS_NAME}>GetPlayerByUserId</span>
          <span>(receiptInfo.</span>
          <span className={CODE_PARAMETER_CLASS_NAME}>PlayerId</span>
          <span>)</span>
        </p>

        {newLine}
        <p className={CODE_LINE_CLASS_NAME}>
          {tab}
          <span className={CODE_VARIABLE_CLASS_NAME}>if not</span>
          <span> player </span>
          <span className={CODE_VARIABLE_CLASS_NAME}>then</span>
        </p>
        <p className={CODE_LINE_CLASS_NAME}>
          {tab}
          {tab}
          <span className={CODE_VARIABLE_CLASS_NAME}>return </span>
          <span className={CODE_PARAMETER_CLASS_NAME}>
            Enum.ProductPurchaseDecision.NotProcessedYet
          </span>
        </p>
        <p className={CODE_LINE_CLASS_NAME}>
          {tab}
          <span className={CODE_VARIABLE_CLASS_NAME}>end</span>
        </p>

        {productIds.length > 0 && newLine}
        {productIds.map((productId, index) => (
          <Fragment key={productId}>
            <p className={CODE_LINE_CLASS_NAME}>
              {tab}
              <span className={CODE_VARIABLE_CLASS_NAME}>{index === 0 ? 'if ' : 'elseif '}</span>
              <span>receiptInfo.</span>
              <span className={CODE_PARAMETER_CLASS_NAME}>ProductId</span>
              <span>{` == DEV_PRODUCT_ID_${index + 1} `}</span>
              <span className={CODE_VARIABLE_CLASS_NAME}>then</span>
            </p>
            <p className={CODE_LINE_CLASS_NAME}>
              <span className='content-muted'>
                {tab}
                {tab}
                <span>{'-- '}</span>
                <span className='content-system-success'>TODO: </span>
                <span>Give the reward and store in user&apos;s inventory</span>
              </span>
            </p>
            <p className={CODE_LINE_CLASS_NAME}>
              {tab}
              {tab}
              <span className={CODE_VARIABLE_CLASS_NAME}>return </span>
              <span className={CODE_PARAMETER_CLASS_NAME}>
                Enum.ProductPurchaseDecision.PurchaseGranted
              </span>
            </p>
          </Fragment>
        ))}
        {productIds.length > 0 && (
          <p className={CODE_LINE_CLASS_NAME}>
            {tab}
            <span className={CODE_VARIABLE_CLASS_NAME}>end</span>
          </p>
        )}

        {newLine}
        <p className={CODE_LINE_CLASS_NAME}>
          {tab}
          <span className={CODE_VARIABLE_CLASS_NAME}>return </span>
          <span className={CODE_PARAMETER_CLASS_NAME}>
            Enum.ProductPurchaseDecision.NotProcessedYet
          </span>
        </p>
        <p className={CODE_LINE_CLASS_NAME}>
          <span className={CODE_VARIABLE_CLASS_NAME}>end</span>
        </p>
      </div>
      {/* oxlint-enable rbx/no-hardcoded-translation-string */}
    </div>
  );
};

export default withTranslation(ProcessReceiptCodeSnippet, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

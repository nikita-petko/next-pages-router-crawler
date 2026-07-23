import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FileCopyOutlinedIcon,
  FormControlLabel,
  Typography,
} from '@rbx/ui';
import React, { useCallback } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import usePlayWithRewardStyles from './PlayWithReward.styles';
import {
  PlayWithRewardCreationModalFormField,
  PlayWithRewardFormValues,
} from '../types/playWithRewardCreationModal';
import ExperienceDetailsPageDocsLink from './ExperienceDetailsPageDocsLink';

interface CreationModalProcessReceiptStepProps {
  handlePlayWithRewardModalCreate: () => void;
  handlePlayWithRewardModalBack: () => void;
  handlePlayWithRewardModalCancel: () => void;
}

const CreationModalProcessReceiptStep = ({
  handlePlayWithRewardModalCreate,
  handlePlayWithRewardModalBack,
  handlePlayWithRewardModalCancel,
}: CreationModalProcessReceiptStepProps) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    classes: {
      dialogContentContainer,
      codeWrapper,
      codeBlock,
      codeHeader,
      codeHeaderContentContainer,
      copyButtonContainer,
      codeSnippetComment,
      codeSnippetParameter,
      codeSnippetValue,
      codeSnippetVariable,
      dialogActionsContainer,
      leftDialogActions,
      prewrap,
    },
  } = usePlayWithRewardStyles();
  const {
    control,
    formState: { errors, dirtyFields },
  } = useFormContext<PlayWithRewardFormValues>();
  const productId = useWatch<PlayWithRewardFormValues>({
    control,
    name: PlayWithRewardCreationModalFormField.PRODUCT_ID,
  });

  const handleCopyToClipboard = useCallback(async (currentProductId: number) => {
    const copyString = `local DEV_PRODUCT_ID = ${currentProductId}
  MarketplaceService.ProcessReceipt = function(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then
      return Enum.ProductPurchaseDecision.NotProcessedYet
    end
  
    if receiptInfo.ProductId == DEV_PRODUCT_ID then
       -- TODO: Give the reward and store in user's inventory
      return Enum.ProductPurchaseDecision.PurchaseGranted
    end
  
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end`;
    try {
      await navigator.clipboard.writeText(copyString);
      // TODO: ADS-8577 - add success toast
    } catch {
      // TODO: ADS-8577 - add failure toast
    }
  }, []);

  const tabElement = <span className={prewrap}>{'  '}</span>;
  const newLine = <span className={prewrap}>{'\n'}</span>;

  return (
    <React.Fragment>
      <DialogContent>
        <div className={dialogContentContainer}>
          <Typography variant='body1' color='secondary'>
            {translate(
              translationKey(
                'Description.ProcessReceipt',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
          </Typography>
          <div>
            <div className={codeHeader}>
              <div className={codeHeaderContentContainer}>
                <Typography variant='body2' component='p' color='secondary'>
                  {translate(
                    translationKey(
                      'Label.ServerSideScript',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                  )}
                </Typography>
                <Button
                  size='small'
                  color='secondary'
                  variant='text'
                  onClick={() => handleCopyToClipboard(productId)}>
                  <div className={copyButtonContainer}>
                    <FileCopyOutlinedIcon />
                    <span>
                      {translate(
                        translationKey('Label.Copy', TranslationNamespace.ImmersiveAdsAnalytics),
                      )}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
            <div className={codeBlock}>
              <Typography variant='body2' component='p' className={codeWrapper}>
                <span className={codeSnippetVariable}>local</span>
                <span> DEV_PRODUCT_ID = </span>
                <span className={codeSnippetParameter}>{productId}</span>
                <span> </span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                <span>MarketplaceService.</span>
                <span className={codeSnippetParameter}>ProcessReceipt</span>
                <span>&nbsp;= function(receiptInfo)</span>
                <span> </span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                {tabElement}
                <span className={codeSnippetVariable}>local</span>
                <span> player = Players:</span>
                <span className={codeSnippetParameter}>GetPlayerByUserId</span>
                <span>(receiptInfo.</span>
                <span className={codeSnippetParameter}>PlayerId</span>
                <span>)</span>
                <span> </span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                {tabElement}
                <span className={codeSnippetVariable}>if not</span>
                <span> player </span>
                <span className={codeSnippetVariable}>then</span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                {tabElement}
                {tabElement}
                <span className={codeSnippetVariable}>return </span>
                <span className={codeSnippetParameter}>
                  Enum.ProductPurchaseDecision.NotProcessedYet
                </span>
              </Typography>

              <Typography variant='body2' component='p'>
                <span className={codeSnippetVariable}>{tabElement}end</span>
              </Typography>
              {newLine}
              <Typography variant='body2' component='p' className={codeWrapper}>
                {tabElement}
                <span className={codeSnippetVariable}>if </span>
                <span>receiptInfo.</span>
                <span className={codeSnippetParameter}>ProductId </span>
                <span>== DEV_PRODUCT_ID </span>
                <span className={codeSnippetVariable}>then </span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                <span className={codeSnippetComment}>
                  {tabElement}
                  {tabElement}
                  {' -- '}
                  <span className={codeSnippetValue}>TODO: </span>
                  <span>Give the reward and store in user&apos;s inventory</span>
                </span>
              </Typography>

              <Typography variant='body2' component='p' className={codeWrapper}>
                <span className={codeSnippetVariable}>
                  {tabElement}
                  {tabElement}
                  return{' '}
                </span>
                <span className={codeSnippetParameter}>
                  Enum.ProductPurchaseDecision.PurchaseGranted
                </span>
              </Typography>

              <Typography variant='body2' component='p'>
                <span className={codeSnippetVariable}>{tabElement}end</span>
              </Typography>

              {newLine}
              <Typography variant='body2' component='p' className={codeWrapper}>
                <span className={codeSnippetVariable}>
                  {tabElement}
                  return{' '}
                </span>
                <span className={codeSnippetParameter}>
                  Enum.ProductPurchaseDecision.NotProcessedYet
                </span>
              </Typography>

              <Typography variant='body2' component='p'>
                <span className={codeSnippetVariable}>end</span>
              </Typography>
            </div>
          </div>
          <Controller
            control={control}
            name={PlayWithRewardCreationModalFormField.ACKNOWLEDGE_CHECKBOX}
            rules={{
              validate: (value) => {
                return value || 'Please check the box to continue';
              },
            }}
            render={({ field: { onChange, value } }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    color='primary'
                    size='medium'
                    onChange={(e) => {
                      onChange(e.target.checked);
                    }}
                    checked={value}
                  />
                }
                label={translateHTML(
                  translationKey(
                    'Label.AcknowledgeProcessReceipt',
                    TranslationNamespace.ImmersiveAdsAnalytics,
                  ),
                  [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content: ExperienceDetailsPageDocsLink,
                    },
                  ],
                )}
              />
            )}
          />
        </div>
      </DialogContent>
      <DialogActions className={dialogActionsContainer}>
        <div className={leftDialogActions}>
          <Button
            onClick={handlePlayWithRewardModalCreate}
            variant='contained'
            color='primaryBrand'
            disabled={
              !(
                dirtyFields[PlayWithRewardCreationModalFormField.ACKNOWLEDGE_CHECKBOX] &&
                errors[PlayWithRewardCreationModalFormField.ACKNOWLEDGE_CHECKBOX] === undefined
              )
            }>
            {translate(translationKey('Label.Create', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Button>
          <Button onClick={handlePlayWithRewardModalBack} variant='contained' color='secondary'>
            {translate(translationKey('Label.Back', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Button>
        </div>
        <Button onClick={handlePlayWithRewardModalCancel} color='secondary'>
          {translate(translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics))}
        </Button>
      </DialogActions>
    </React.Fragment>
  );
};

export default CreationModalProcessReceiptStep;

import { itemconfigurationClient } from '@modules/clients';
import { PageNotFound } from '@modules/miscellaneous/error';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import { Divider, Grid } from '@rbx/ui';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import {
  GetPricingPolicy,
  GetTokenDetails,
  UpdateAvatarCreationToken,
} from '@modules/react-query/openCloudAvatarCreationTokens';
import { V2CloudProtos } from '@rbx/open-cloud';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useAuthentication } from '@modules/authentication/providers';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { Asset } from '@modules/miscellaneous/common';
import {
  defaultPricingPolicy,
  TAvatarCreationTokenDispayInformation,
  TAvatarCreationTokenSaleInformation,
} from '../../constants/AvatarCreationTokenConstants';
import DisplayInformationComponent from '../DisplayInformationComponent';
import SaleInformationComponent from '../SaleInformationComponent';
import SubmitButtonComponent from '../SubmitButtonComponent';
import PublishingDisclaimerComponent from '../PublishingDisclaimerComponent';
import useAvatarCreationTokenStyles from '../Styles/AvatarCreationTokenStyles.styles';
import CancelButtonComponent from '../CancelButtonComponent';
import TokenIdComponent from '../TokenIdComponent';
import {
  ConvertOcToTokenData,
  MakeGetPricingPolicyRequest,
  MakeGetTokenDetailsRequest,
  MakeUpdateAvatarCreationTokenRequest,
  validateForm,
} from '../../utils/formHelpers';
import ErrorToast from '../ErrorToast';
import useEnabledIecItemTypes from '../../../common/hooks/useEnabledIecItemTypes';
import { translateBundleTypeToBundleTypeString } from '../../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { BundleType } from '../../../avatarItem/constants/avatarItemConstants';

export type TConfigureAvatarCreationTokenFormProps = {
  tokenId: string;
};

const ConfigureAvatarCreationTokenForm: FC<
  React.PropsWithChildren<TConfigureAvatarCreationTokenFormProps>
> = ({ tokenId }) => {
  const {
    classes: { inputForm },
  } = useAvatarCreationTokenStyles();
  const router = useRouter();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { data: collectiblesMetadata } = useGetMetadata(itemconfigurationClient);
  const { enabledItemTypes, enabledItemTypesMetadata } = useEnabledIecItemTypes();
  const [displayInformation, setDisplayInformation] =
    useState<TAvatarCreationTokenDispayInformation>({
      name: '',
      description: '',
      itemType: null,
    });
  const [saleInformation, setSaleInformation] = useState<TAvatarCreationTokenSaleInformation>({
    priceOffset: undefined,
    minimumPrice: undefined,
  });

  const { id } = router.query;
  const returnToMonetizationAvatarCreationTokens = useCallback(() => {
    window.open(dashboard.getMonetizationAvatarCreationTokensUrl(Number(id)), '_self');
  }, [id]);

  const { mutateAsync: GetTokenDetailsAsync } = GetTokenDetails(
    MakeGetTokenDetailsRequest(id as string, tokenId),
  );

  // Form validation
  const [formValid, setFormValid] = useState(false);
  useEffect(() => {
    const valid = validateForm({ displayInformation, saleInformation });
    setFormValid(valid);
  }, [displayInformation, saleInformation]);

  const { mutateAsync: GetPricingPolicyAsync } = GetPricingPolicy();
  const [PricingPolicy, setPricingPolicy] =
    useState<V2CloudProtos.AvatarCreationToken.IPricingPolicy>(defaultPricingPolicy);
  const [failedToLoad, setFailedToLoad] = useState(false);
  useEffect(() => {
    async function PopulateTokenData() {
      if (router.isReady) {
        try {
          const tokenDetails = await GetTokenDetailsAsync();
          const tokenData = ConvertOcToTokenData(tokenDetails);
          setDisplayInformation(tokenData.displayInformation);
          setSaleInformation(tokenData.saleInformation);
          const pricingPolicies = await GetPricingPolicyAsync(
            MakeGetPricingPolicyRequest(id as string),
          );
          const bundlePolicyMap = pricingPolicies.bundlePricingPolicyMap;
          const assetPolicyMap = pricingPolicies.assetPricingPolicyMap;
          const policyMap = { ...bundlePolicyMap, ...assetPolicyMap };

          let itemType = tokenData.displayInformation.itemType!.toString();

          if (itemType === 'TShirtAccessory') {
            itemType = 'TshirtAccessory';
          }

          // If it's a bundle type, convert the number to the string (e.g. 1 -> 'Body')
          // since PricingPolicy expects it as 'Body'
          if (
            tokenData.displayInformation.itemType &&
            !(tokenData.displayInformation.itemType in Asset)
          ) {
            itemType = translateBundleTypeToBundleTypeString(
              tokenData.displayInformation.itemType as BundleType,
            );
          }
          setPricingPolicy(policyMap[itemType]);
        } catch {
          setFailedToLoad(true);
        }
      }
    }
    PopulateTokenData();
  }, [id, GetTokenDetailsAsync, router.isReady, GetPricingPolicyAsync]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: updateAvatarCreationToken } = UpdateAvatarCreationToken();
  const onSubmit = useCallback(async () => {
    const request = MakeUpdateAvatarCreationTokenRequest(id as string, tokenId, {
      displayInformation,
      saleInformation,
    });
    setSubmitting(true);
    const errorKey = await updateAvatarCreationToken(request);
    setSubmitting(false);
    if (errorKey !== undefined) {
      setSubmitError(errorKey);
      unifiedLogger.logErrorEvent({
        eventName: 'oc_avatar_creation_token_error',
        parameters: {
          userId: user?.id.toString() ?? 'undefinedId',
          operation: 'UpdateAvatarCreationToken',
          errorCode: errorKey,
          errorMessage: translate(errorKey),
        },
      });
      return;
    }

    window.open(dashboard.getMonetizationAvatarCreationTokensUrl(Number(id)), '_self');
  }, [
    id,
    tokenId,
    displayInformation,
    saleInformation,
    updateAvatarCreationToken,
    unifiedLogger,
    user?.id,
    translate,
  ]);

  function handleSubmitButtonClick() {
    onSubmit();
  }

  if (
    collectiblesMetadata === undefined ||
    ('isAvatarCreationTokensUIEnabled' in collectiblesMetadata &&
      !collectiblesMetadata.isAvatarCreationTokensUIEnabled)
  ) {
    return <PageNotFound />;
  }

  if (failedToLoad) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={() => router.reload()}
      />
    );
  }

  return (
    <Grid container item direction='column' className={inputForm} XSmall={12} XLarge={10}>
      <DisplayInformationComponent
        value={displayInformation}
        onChange={(e) => setDisplayInformation(e)}
        isItemTypeDisabled
        enabledItemTypes={enabledItemTypes}
        enabledItemTypesMetadata={enabledItemTypesMetadata}
      />
      <TokenIdComponent tokenId={tokenId} />
      <Divider style={{ margin: '10px 0' }} />
      <SaleInformationComponent
        value={saleInformation}
        onChange={(e) => setSaleInformation(e)}
        priceFloor={
          PricingPolicy.priceFloorRobux !== undefined ? Number(PricingPolicy.priceFloorRobux) : 0
        }
        itemType={displayInformation.itemType}
        enabledItemTypesMetadata={enabledItemTypesMetadata}
      />
      <Divider style={{ margin: '10px 0' }} />
      <Grid container item style={{ marginTop: '30px' }}>
        <CancelButtonComponent
          clickFunction={returnToMonetizationAvatarCreationTokens}
          disabled={submitting}
          loading={false}
        />
        <SubmitButtonComponent
          clickFunction={() => handleSubmitButtonClick()}
          disabled={!formValid}
          loading={submitting}
        />
      </Grid>
      <PublishingDisclaimerComponent />
      {submitError !== null ? (
        <ErrorToast
          TitleKey='Message.SavingUnsuccessful'
          ErrorMessagePrefixKey='Message.SaveErrorMsgPrefix'
          ErrorMessageKey={submitError}
          onClose={() => setSubmitError(null)}
        />
      ) : null}
    </Grid>
  );
};

export default withTranslation(ConfigureAvatarCreationTokenForm, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Error,
]);

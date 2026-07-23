import type { FC } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { Asset } from '@modules/miscellaneous/common';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import {
  GetPricingPolicy,
  GetTokenDetails,
  UpdateAvatarCreationToken,
} from '@modules/react-query/openCloudAvatarCreationTokens';
import type { AvatarCreationTokenPricingPolicy } from '@modules/react-query/openCloudAvatarCreationTokens/openCloudAvatarCreationTokensRequests';
import type { BundleType } from '../../../avatarItem/constants/avatarItemConstants';
import useEnabledIecItemTypes from '../../../common/hooks/useEnabledIecItemTypes';
import { translateBundleTypeToBundleTypeString } from '../../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import type {
  TAvatarCreationTokenDisplayInformation,
  TAvatarCreationTokenSaleInformation,
} from '../../constants/AvatarCreationTokenConstants';
import { defaultPricingPolicy } from '../../constants/AvatarCreationTokenConstants';
import {
  ConvertOcToTokenData,
  MakeGetPricingPolicyRequest,
  MakeGetTokenDetailsRequest,
  MakeUpdateAvatarCreationTokenRequest,
  validateForm,
} from '../../utils/formHelpers';
import CancelButtonComponent from '../CancelButtonComponent';
import DisplayInformationComponent from '../DisplayInformationComponent';
import ErrorToast from '../ErrorToast';
import PublishingDisclaimerComponent from '../PublishingDisclaimerComponent';
import SaleInformationComponent from '../SaleInformationComponent';
import useAvatarCreationTokenStyles from '../Styles/AvatarCreationTokenStyles.styles';
import SubmitButtonComponent from '../SubmitButtonComponent';
import TokenIdComponent from '../TokenIdComponent';

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
    useState<TAvatarCreationTokenDisplayInformation>({
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
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by `router.isReady && id` upstream
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
    useState<AvatarCreationTokenPricingPolicy>(defaultPricingPolicy);
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
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by `router.isReady && id` upstream
            MakeGetPricingPolicyRequest(id as string),
          );
          const bundlePolicyMap = pricingPolicies.bundlePricingPolicyMap;
          const assetPolicyMap = pricingPolicies.assetPricingPolicyMap;
          const policyMap = { ...bundlePolicyMap, ...assetPolicyMap };

          // oxlint-disable-next-line typescript/no-non-null-assertion -- preserve master's contract that itemType is set on a fetched token
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
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- discriminated by `!(itemType in Asset)` so it is a BundleType
              tokenData.displayInformation.itemType as BundleType,
            );
          }
          setPricingPolicy(policyMap[itemType]);
        } catch {
          setFailedToLoad(true);
        }
      }
    }
    // oxlint-disable-next-line typescript/no-floating-promises -- effects can't be async; preserve master form
    PopulateTokenData();
  }, [id, GetTokenDetailsAsync, router.isReady, GetPricingPolicyAsync]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: updateAvatarCreationToken } = UpdateAvatarCreationToken();
  const onSubmit = useCallback(async () => {
    const request = MakeUpdateAvatarCreationTokenRequest(
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by `router.isReady && id` upstream
      id as string,
      tokenId,
      {
        displayInformation,
        saleInformation,
      },
    );
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
    // oxlint-disable-next-line typescript/no-floating-promises -- preserve master form
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
          PricingPolicy.priceFloorRobux !== undefined
            ? // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- OpenCloud returns Robux fields as strings on the wire despite typed as `number`
              Number(PricingPolicy.priceFloorRobux)
            : 0
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

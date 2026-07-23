import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Grid } from '@rbx/ui';
import { FC, useCallback, useEffect, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { usePathname, useSearchParams } from 'next/navigation';
import Router, { useRouter } from 'next/router';
import { uuidService } from '@rbx/core';
import { itemconfigurationClient } from '@modules/clients';
import { PageNotFound } from '@modules/miscellaneous/error';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useAuthentication } from '@modules/authentication/providers';
import {
  CreateAvatarCreationToken,
  GetPricingPolicy,
} from '@modules/react-query/openCloudAvatarCreationTokens';
import { V2CloudProtos } from '@rbx/open-cloud';
// eslint-disable-next-line no-restricted-imports -- Needed to get current group ID.
import useAppBreadcrumbsData from '@modules/navigation/layout/hooks/useAppBreadcrumbsData';
import { Asset } from '@modules/miscellaneous/common';
import { translateBundleTypeToBundleTypeString } from '../../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { BundleType } from '../../../avatarItem/constants/avatarItemConstants';
import DisplayInformationComponent from '../DisplayInformationComponent';
import SaleInformationComponent from '../SaleInformationComponent';
import useAvatarCreationTokenStyles from '../Styles/AvatarCreationTokenStyles.styles';
import SubmitButtonComponent from '../SubmitButtonComponent';
import CreationAdvanceComponent from '../CreationAdvanceComponent';
import PublishingDisclaimerComponent from '../PublishingDisclaimerComponent';
import {
  defaultPricingPolicy,
  TAvatarCreationTokenDispayInformation,
  TAvatarCreationTokenSaleInformation,
} from '../../constants/AvatarCreationTokenConstants';
import {
  MakeCreateAvatarCreationTokenRequest,
  MakeGetPricingPolicyRequest,
  validateForm,
} from '../../utils/formHelpers';
import ErrorToast from '../ErrorToast';
import CancelButtonComponent from '../CancelButtonComponent';
import useEnabledIecItemTypes from '../../../common/hooks/useEnabledIecItemTypes';

const CreateAvatarCreationTokenForm: FC<object> = () => {
  const {
    classes: { inputForm },
  } = useAvatarCreationTokenStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { enabledItemTypes, enabledItemTypesMetadata } = useEnabledIecItemTypes();

  const idempotencyKeyParamName = 'idempotencyKey';

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

  const [formValid, setFormValid] = useState(false);
  useEffect(() => {
    const valid = validateForm({ displayInformation, saleInformation });
    setFormValid(valid);
  }, [displayInformation, saleInformation]);

  const { id } = router.query;
  const [routerReady, setRouterReady] = useState(false);
  useEffect(() => {
    setRouterReady(router.isReady);
  }, [router.isReady]);

  const [PricingPolicyMap, setPricingPolicyMap] = useState<{
    [key: string]: V2CloudProtos.AvatarCreationToken.IPricingPolicy;
  }>({});
  const { mutateAsync: GetPricingPolicyAsync } = GetPricingPolicy();
  const [PricingPolicy, setPricingPolicy] =
    useState<V2CloudProtos.AvatarCreationToken.IPricingPolicy>(defaultPricingPolicy);
  useEffect(() => {
    async function PopulatePricingPolicyDictionary() {
      if (router.isReady) {
        const pricingPolicies = await GetPricingPolicyAsync(
          MakeGetPricingPolicyRequest(id as string),
        );
        const bundlePolicyMap = pricingPolicies.bundlePricingPolicyMap;
        const assetPolicyMap = pricingPolicies.assetPricingPolicyMap;
        const policyMap = { ...bundlePolicyMap, ...assetPolicyMap };
        setPricingPolicyMap(policyMap);
      }
    }
    PopulatePricingPolicyDictionary();
  }, [GetPricingPolicyAsync, id, router]);

  // Handle form submission.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { user } = useAuthentication();
  const currentGroup = useAppBreadcrumbsData();
  const { mutateAsync: createAvatarCreationTokenAsync } = CreateAvatarCreationToken();
  const handleSubmitButtonClick = useCallback(async () => {
    const data = { displayInformation, saleInformation };
    let curIdempotencyKey = searchParams.get(idempotencyKeyParamName);
    if (curIdempotencyKey === null) {
      const newIdempotencyKey = uuidService.generateRandomUuid();
      Router.push(`${pathname}/?${idempotencyKeyParamName}=${newIdempotencyKey}`, undefined, {
        shallow: true,
      });
      curIdempotencyKey = newIdempotencyKey;
    }
    setSubmitting(true);
    const request = await MakeCreateAvatarCreationTokenRequest(
      data,
      PricingPolicy,
      id! as string,
      user?.id.toString() ?? '',
      currentGroup.currentItemGroupId,
      curIdempotencyKey,
    );
    const errorKey = await createAvatarCreationTokenAsync(request);

    setSubmitting(false);
    if (errorKey !== undefined) {
      setSubmitError(errorKey);
      unifiedLogger.logErrorEvent({
        eventName: 'oc_avatar_creation_token_error',
        parameters: {
          userId: user?.id.toString() ?? 'undefinedId',
          operation: 'CreateAvatarCreationToken',
          errorCode: errorKey,
          errorMessage: translate(errorKey),
        },
      });
      Router.push(`${pathname}`, undefined, { shallow: true });
      return;
    }

    window.open(dashboard.getMonetizationAvatarCreationTokensUrl(Number(id)), '_self');
  }, [
    displayInformation,
    saleInformation,
    searchParams,
    PricingPolicy,
    id,
    user?.id,
    currentGroup.currentItemGroupId,
    createAvatarCreationTokenAsync,
    pathname,
    unifiedLogger,
    translate,
  ]);

  useEffect(() => {
    let itemType = displayInformation.itemType?.toString();

    if (itemType === 'TShirtAccessory') {
      itemType = 'TshirtAccessory';
    }

    // If it's a bundle type, convert the number to the string (e.g. 1 -> 'Body')
    // since PricingPolicy expects it as 'Body'
    if (displayInformation.itemType && !(displayInformation.itemType in Asset)) {
      itemType = translateBundleTypeToBundleTypeString(displayInformation.itemType as BundleType);
    }

    if (itemType === undefined || PricingPolicyMap[itemType] === undefined) {
      setPricingPolicy(defaultPricingPolicy);
      return;
    }
    setPricingPolicy(PricingPolicyMap[itemType]);
  }, [PricingPolicyMap, displayInformation]);

  function getCreationPrice() {
    const creationAdvance = (PricingPolicy.creationCosts?.creationAdvanceRobux as number) || 0;
    const creationFee = (PricingPolicy.creationCosts?.creationFeeRobux as number) || 0;
    return +creationAdvance + +creationFee;
  }

  const returnToMonetizationAvatarCreationTokens = useCallback(() => {
    window.open(dashboard.getMonetizationAvatarCreationTokensUrl(Number(id)), '_self');
  }, [id]);

  const { data: collectiblesMetadata } = useGetMetadata(itemconfigurationClient);
  if (
    collectiblesMetadata === undefined ||
    ('isAvatarCreationTokensUIEnabled' in collectiblesMetadata &&
      !collectiblesMetadata.isAvatarCreationTokensUIEnabled)
  ) {
    return <PageNotFound />;
  }

  if (!router.query.id) {
    return <div />;
  }

  return (
    <Grid container item direction='column' className={inputForm} XSmall={12} XLarge={10}>
      <DisplayInformationComponent
        value={displayInformation}
        onChange={(e) => setDisplayInformation(e)}
        enabledItemTypes={enabledItemTypes}
        enabledItemTypesMetadata={enabledItemTypesMetadata}
      />
      <Divider style={{ margin: '10px 0' }} />
      <SaleInformationComponent
        value={saleInformation}
        onChange={(e) => setSaleInformation(e)}
        priceFloor={PricingPolicy.priceFloorRobux as number}
        itemType={displayInformation.itemType}
        enabledItemTypesMetadata={enabledItemTypesMetadata}
      />
      <Divider style={{ margin: '10px 0' }} />
      <div style={{ margin: '20px 0 0 0' }}>
        <CreationAdvanceComponent
          publishingAdvance={PricingPolicy.creationCosts?.creationAdvanceRobux as number}
          creationFee={PricingPolicy.creationCosts?.creationFeeRobux as number}
        />
      </div>
      <Grid container item rowGap={2} style={{ marginTop: '0' }}>
        <CancelButtonComponent
          clickFunction={returnToMonetizationAvatarCreationTokens}
          disabled={submitting}
          loading={false}
        />
        <SubmitButtonComponent
          clickFunction={handleSubmitButtonClick}
          disabled={!formValid || !routerReady}
          loading={submitting}
          price={getCreationPrice()}
        />
      </Grid>
      <PublishingDisclaimerComponent />
      {submitError !== null ? (
        <ErrorToast
          TitleKey='Message.PublishingUnsuccessful'
          ErrorMessagePrefixKey='Message.PublishErrorMsgPrefix'
          ErrorMessageKey={submitError}
          onClose={() => setSubmitError(null)}
        />
      ) : null}
    </Grid>
  );
};

export default withTranslation(CreateAvatarCreationTokenForm, [TranslationNamespace.ConfigureItem]);

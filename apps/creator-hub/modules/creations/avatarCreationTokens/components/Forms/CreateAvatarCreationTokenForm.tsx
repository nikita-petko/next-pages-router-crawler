import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Router, { useRouter } from 'next/router';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { Asset } from '@modules/miscellaneous/common';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import useAppBreadcrumbsData from '@modules/navigation/layout/hooks/useAppBreadcrumbsData';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import {
  CreateAvatarCreationToken,
  GetPricingPolicy,
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
  MakeCreateAvatarCreationTokenRequest,
  MakeGetPricingPolicyRequest,
  validateForm,
} from '../../utils/formHelpers';
import CancelButtonComponent from '../CancelButtonComponent';
import CreationAdvanceComponent from '../CreationAdvanceComponent';
import DisplayInformationComponent from '../DisplayInformationComponent';
import ErrorToast from '../ErrorToast';
import PublishingDisclaimerComponent from '../PublishingDisclaimerComponent';
import SaleInformationComponent from '../SaleInformationComponent';
import useAvatarCreationTokenStyles from '../Styles/AvatarCreationTokenStyles.styles';
import SubmitButtonComponent from '../SubmitButtonComponent';

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
    useState<TAvatarCreationTokenDisplayInformation>({
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
    [key: string]: AvatarCreationTokenPricingPolicy;
  }>({});
  const { mutateAsync: GetPricingPolicyAsync } = GetPricingPolicy();
  const [PricingPolicy, setPricingPolicy] =
    useState<AvatarCreationTokenPricingPolicy>(defaultPricingPolicy);
  useEffect(() => {
    async function PopulatePricingPolicyDictionary() {
      if (router.isReady) {
        const pricingPolicies = await GetPricingPolicyAsync(
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by `router.isReady` upstream
          MakeGetPricingPolicyRequest(id as string),
        );
        const bundlePolicyMap = pricingPolicies.bundlePricingPolicyMap;
        const assetPolicyMap = pricingPolicies.assetPricingPolicyMap;
        const policyMap = { ...bundlePolicyMap, ...assetPolicyMap };
        setPricingPolicyMap(policyMap);
      }
    }
    // oxlint-disable-next-line typescript/no-floating-promises -- effects can't be async; preserve master form
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
      // oxlint-disable-next-line typescript/no-floating-promises -- preserve master form
      Router.push(`${pathname}/?${idempotencyKeyParamName}=${newIdempotencyKey}`, undefined, {
        shallow: true,
      });
      curIdempotencyKey = newIdempotencyKey;
    }
    setSubmitting(true);
    const request = await MakeCreateAvatarCreationTokenRequest(
      data,
      PricingPolicy,
      // oxlint-disable-next-line typescript/no-non-null-assertion, typescript/no-unsafe-type-assertion -- guarded by `router.isReady && id` upstream
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
      // oxlint-disable-next-line typescript/no-floating-promises, typescript/no-unnecessary-template-expression -- preserve master form
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
      itemType = translateBundleTypeToBundleTypeString(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- discriminated by `!(itemType in Asset)` so it is a BundleType
        displayInformation.itemType as BundleType,
      );
    }

    if (itemType === undefined || PricingPolicyMap[itemType] === undefined) {
      setPricingPolicy(defaultPricingPolicy);
      return;
    }
    setPricingPolicy(PricingPolicyMap[itemType]);
  }, [PricingPolicyMap, displayInformation]);

  function getCreationPrice() {
    // OpenCloud returns Robux fields as strings on the wire (the openapi-fetch
    // type says `number` but the runtime payload is string to avoid JS large-int
    // issues). The unary `+` coerces so `+a + +b` is numeric addition and not
    // string concatenation (otherwise 1500 + 750 renders as "1500750").
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- runtime payload may be string; `+` below coerces
    const creationAdvance = (PricingPolicy.creationCosts?.creationAdvanceRobux as number) || 0;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- runtime payload may be string; `+` below coerces
    const creationFee = (PricingPolicy.creationCosts?.creationFeeRobux as number) || 0;
    // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- runtime values may be strings; force numeric addition
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
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserve master form; runtime coercion happens downstream
        priceFloor={PricingPolicy.priceFloorRobux as number}
        itemType={displayInformation.itemType}
        enabledItemTypesMetadata={enabledItemTypesMetadata}
      />
      <Divider style={{ margin: '10px 0' }} />
      <div style={{ margin: '20px 0 0 0' }}>
        <CreationAdvanceComponent
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserve master form; runtime coercion happens downstream
          publishingAdvance={PricingPolicy.creationCosts?.creationAdvanceRobux as number}
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserve master form; runtime coercion happens downstream
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

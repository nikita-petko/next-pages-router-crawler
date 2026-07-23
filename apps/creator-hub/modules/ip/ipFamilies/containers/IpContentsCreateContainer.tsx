import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IPFamilyOwnershipTypesEnum } from '@rbx/client-rights/v1';
import { Radio, RadioGroup, Button, Stepper, ProgressCircle } from '@rbx/foundation-ui';
import type { TStepperStep } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import getApprovedPendingOrBlockedImages from '../common/getApprovedOrPendingImages';
import IpContentsCreateForm, { type FormStore } from '../components/IpContentsCreateForm';
import IpFamiliesBreadcrumbs from '../components/IpFamiliesBreadcrumbs';
import TrademarkCreateForm, { type TrademarkFormStore } from '../components/TrademarkCreateForm';
import { MAX_FORM_WIDTH_PX } from '../constants';
import {
  useCreateIpContentsAndAddToIpFamily,
  useIpFamilyQuery,
  useListAllIpContentsByIpFamily,
  useCreateTrademarkMutation,
} from '../hooks/ipFamily';
import { IP_FAMILY_DETAILS_HREF } from '../urls';

enum IpContentType {
  trademark = 'TRADEMARK',
  copyright = 'COPYRIGHT',
}

interface IpContentTypeSelectionFormProps {
  isSubmitting: boolean;
  ipContentType?: IpContentType;
  setIpContentType: (ipContentType: IpContentType) => void;
  onClickNext: () => void;
  onClickBack: () => void;
}

/**
 * Section to choose between adding copyright or trademark IP contents.
 */
const IpContentTypeSelectionForm = ({
  isSubmitting,
  ipContentType,
  setIpContentType,
  onClickNext,
  onClickBack,
}: IpContentTypeSelectionFormProps) => {
  const { translate } = useTranslation();

  return (
    <div className='padding-top-medium'>
      <h2 className='text-title-large content-emphasis padding-y-medium margin-none'>
        {translate('Heading.IPType')}
      </h2>
      <div className='padding-y-small'>
        <RadioGroup
          value={ipContentType}
          onValueChange={(value) => {
            if (isValidEnumValue(IpContentType, value)) {
              setIpContentType(value);
            }
          }}>
          <Radio
            value={IpContentType.copyright}
            label={translate('Label.CopyrightedWork')}
            size='Large'
            isDisabled={isSubmitting}
          />
          <Radio
            value={IpContentType.trademark}
            label={translate('Label.RegisteredTrademark')}
            size='Large'
            isDisabled={isSubmitting}
          />
        </RadioGroup>
      </div>
      <div className='flex flex-row gap-small padding-top-large'>
        <Button
          variant='Standard'
          type='button'
          size='Medium'
          isDisabled={isSubmitting}
          onClick={onClickBack}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='Emphasis'
          type='button'
          size='Medium'
          isDisabled={isSubmitting || ipContentType === undefined}
          onClick={onClickNext}>
          {translate('Action.Continue')}
        </Button>
      </div>
    </div>
  );
};

/**
 * Page to create new IP contents.
 */
const IpContentsCreateContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const rawId = router.query.id;
  const id = typeof rawId === 'string' ? rawId : '';
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [ipContentType, setIpContentType] = useState<IpContentType | undefined>(undefined);

  // Gate the trademark flow behind IXP feature flag
  const {
    params: { enableTrademark },
  } = useIXPParameters(IXPLayers.RightsManager, {
    restoreInitialValueFromCache: true,
  });

  const ipFamilyReq = useIpFamilyQuery(id);

  const ipContentsReq = useListAllIpContentsByIpFamily({
    ipFamilyId: id,
    pageSize: 500,
  });

  // Calculate how many images/assets are already there otherwise 0
  const allIpContents = ipContentsReq.data?.ipContents ?? [];
  const relevantImagesCount = getApprovedPendingOrBlockedImages(allIpContents).length;

  const createIpContentsAndAddToIpFamilyMutation = useCreateIpContentsAndAddToIpFamily();
  const createTrademarkMutation = useCreateTrademarkMutation();

  const handleSave = async (data: FormStore) => {
    // Filter out the empty primary keywords
    const primaryKeywords = data.primaryKeywords
      .filter((keywordData) => keywordData.keyword)
      .map((keywordData) => ({
        ...keywordData,
        citation: data.primaryKeywordCitation,
      }));

    const secondaryKeywords = data.secondaryKeywords.filter((keywordData) => keywordData.keyword);

    const documents = data.documents.map((document) => ({
      key: document.file.name,
      name: document.file.name,
      url: URL.createObjectURL(document.file),
      file: document.file,
    }));

    const ownershipUrls = data.ownershipUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => !!url);

    // Guard against invalid IDs and drop the display-only `name` before submit
    const assets = data.assets
      .filter((asset) => asset.assetId > 0)
      .map((asset) => ({ assetId: asset.assetId, citation: asset.citation }));

    createIpContentsAndAddToIpFamilyMutation.mutate(
      {
        ipFamilyId: id,
        primaryKeywords,
        secondaryKeywords,
        images: data.images,
        assets,
        additionalDocuments: documents,
        additionalOwnershipUrls: ownershipUrls,
      },
      {
        onSuccess: () => {
          void router.push(IP_FAMILY_DETAILS_HREF(id));
          enqueueSuccessSnackbar('Message.IpContentSubmitted');
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };

  const handleSaveTrademark = async (data: TrademarkFormStore) => {
    const documents = data.documents.map((document) => document.file);

    createTrademarkMutation.mutate(
      {
        ipFamilyId: id,
        trademarkName: data.trademarkName,
        image: data.image,
        registrationNumber: data.registrationNumber,
        registrationCountry: data.registrationCountry,
        documents,
      },
      {
        onSuccess: () => {
          void router.push(IP_FAMILY_DETAILS_HREF(id));
          enqueueSuccessSnackbar('Message.IpContentSubmitted');
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    const pages: { title: string; href?: string }[] = [{ title: translate('Heading.AddIp') }];
    if (ipFamilyReq.data?.name) {
      pages.unshift({
        title: ipFamilyReq.data.name || '',
        href: IP_FAMILY_DETAILS_HREF(id),
      });
    }
    setPageTitle(<IpFamiliesBreadcrumbs pages={pages} />);
  }, [setPageTitle, translate, ipFamilyReq.data?.name, id]);

  const isSubmitting =
    createIpContentsAndAddToIpFamilyMutation.isPending || createTrademarkMutation.isPending;

  const goBackToDetails = useCallback(() => {
    void router.push(IP_FAMILY_DETAILS_HREF(id));
    window.scrollTo(0, 0);
  }, [router, id]);

  const goToStep = useCallback(
    (step: number) => () => {
      setActiveStep(step);
      window.scrollTo(0, 0);
    },
    [setActiveStep],
  );

  if (ipContentsReq.error) {
    return <IpLoadError error={ipContentsReq.error} />;
  }
  if (ipFamilyReq.error) {
    return <IpLoadError error={ipFamilyReq.error} />;
  }

  if (!ipContentsReq.data || !ipFamilyReq.data) {
    return <ProgressCircle variant='Indeterminate' ariaLabel={translate('Label.Loading')} />;
  }

  const ipFamily = ipFamilyReq.data;
  const { ipContents } = ipContentsReq.data;

  const isTrademarkOnly =
    ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Trademark) &&
    !ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Copyright);
  const isCopyrightOnly =
    ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Copyright) &&
    !ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Trademark);

  const renderIpContentsForm = (onClickBack: () => void) => (
    <IpContentsCreateForm
      existingOwnershipUrls={ipFamily.ownershipUrls}
      existingIpContents={ipContents}
      relevantImagesCount={relevantImagesCount}
      isSubmitting={isSubmitting}
      onSubmit={handleSave}
      onClickBack={onClickBack}
    />
  );

  const renderTrademarkForm = (onClickBack: () => void) => (
    <TrademarkCreateForm
      existingIpContents={ipContents}
      relevantImagesCount={relevantImagesCount}
      isSubmitting={isSubmitting}
      onSubmit={handleSaveTrademark}
      onClickBack={onClickBack}
    />
  );

  if (ipFamily.licensingInterest || isCopyrightOnly || !enableTrademark) {
    return renderIpContentsForm(goBackToDetails);
  }
  if (isTrademarkOnly) {
    return renderTrademarkForm(goBackToDetails);
  }

  const steps: TStepperStep[] = [
    { label: translate('Label.IpType') },
    { label: translate('Label.DocumentationDetails') },
  ];

  return (
    <div className='flex flex-col padding-right-xxlarge'>
      <div style={{ maxWidth: MAX_FORM_WIDTH_PX }}>
        <Stepper steps={steps} currentStepIndex={activeStep} size='Medium' />
      </div>
      {activeStep === 0 && (
        <IpContentTypeSelectionForm
          isSubmitting={isSubmitting}
          ipContentType={ipContentType}
          setIpContentType={setIpContentType}
          onClickNext={goToStep(1)}
          onClickBack={goBackToDetails}
        />
      )}

      {activeStep === 1 &&
        ipContentType === IpContentType.trademark &&
        renderTrademarkForm(goToStep(0))}

      {activeStep === 1 &&
        ipContentType === IpContentType.copyright &&
        renderIpContentsForm(goToStep(0))}
    </div>
  );
};

export default withTranslation(IpContentsCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);

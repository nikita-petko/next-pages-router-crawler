import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { Divider, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import Look from '@modules/miscellaneous/common/enums/Look';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useAvatarLooksGate from '../../home/hooks/useAvatarLooksGate';
import VerificationAlert from '../../unifiedFeeSystem/components/VerificationAlert';
import useCurrentLook from '../hooks/useCurrentLook';
import LookItemDetails from './LookItemDetails';
import LookItems from './LookItems';
import LookSavePanel from './LookSavePanel';
import LookTotalPrice from './LookTotalPrice';

const LookConfigureContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { isLoadingLook, lookSalesData, lookDetail } = useCurrentLook();
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const enableMakeupAssets = settings?.enableMakeupAssets;
  const avatarLooksEnabled = useAvatarLooksGate();
  const router = useRouter();

  const [name, setName] = useState(lookDetail?.name ?? '');
  const [description, setDescription] = useState(lookDetail?.description ?? '');

  const isSaveDisabled = !name?.trim();

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  if (isLoadingLook || avatarLooksEnabled === undefined) {
    return (
      <div className='flex justify-center items-center [min-height:450px]'>
        <ProgressCircle
          variant='Indeterminate'
          size='Medium'
          ariaLabel={translate('Label.Loading')}
        />
      </div>
    );
  }

  const looksFeatureEnabled =
    lookDetail?.lookType === Look.Avatar ? (avatarLooksEnabled ?? false) : enableMakeupAssets;

  // IEC looks have no independent marketplace pricing/availability — gate the
  // Pricing section and the LookItems "Unavailable" subsection.
  const creatingUniverseId = lookDetail?.creatingUniverseId;
  const isIecLook = creatingUniverseId != null && creatingUniverseId > 0;

  if (!looksFeatureEnabled || !lookDetail || !lookSalesData) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return (
    <div className='width-full [max-width:1800px] xxlarge:padding-right-[10%]'>
      <VerificationAlert />
      <LookItemDetails
        lookDetail={lookDetail}
        name={name}
        description={description}
        setName={setName}
        setDescription={setDescription}
      />
      <Divider className='margin-y-[40px]' />
      {!isIecLook && (
        <>
          <LookTotalPrice totalValue={lookDetail.totalValue ?? 0} />
          <Divider className='margin-y-[40px]' />
        </>
      )}
      <LookItems
        items={lookDetail?.items ?? []}
        creatingUniverseId={lookDetail?.creatingUniverseId}
      />
      <LookSavePanel
        isSaveDisabled={isSaveDisabled}
        lookId={lookDetail?.lookId ?? ''}
        name={name}
        description={description}
      />
    </div>
  );
};

export default withTranslation(LookConfigureContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetTypes,
]);

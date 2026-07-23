import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Divider, Grid, useMediaQuery, useTheme } from '@rbx/ui';
import { enableAvatarLooks } from '@generated/flags/avatarMarketplace';
import Look from '@modules/miscellaneous/common/enums/Look';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useOverviewStyles from '../../common/components/Overview.styles';
import VerificationAlert from '../../unifiedFeeSystem/components/VerificationAlert';
import useCurrentLook from '../hooks/useCurrentLook';
import LookItemDetails from './LookItemDetails';
import LookItems from './LookItems';
import LookSavePanel from './LookSavePanel';
import LookTotalPrice from './LookTotalPrice';

const LookConfigureContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { isLoadingLook, lookSalesData, lookDetail } = useCurrentLook();
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('XXLarge'));

  const enableMakeupAssets = settings?.enableMakeupAssets;
  const { ready: avatarLooksReady, value: avatarLooksValue } = useFlag(enableAvatarLooks);
  const isAvatarLooksEnabled = avatarLooksValue ?? false;
  const router = useRouter();

  const [name, setName] = useState(lookDetail?.name ?? '');
  const [description, setDescription] = useState(lookDetail?.description ?? '');

  const isSaveDisabled = !name?.trim();

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  if (isLoadingLook || !avatarLooksReady) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  const looksFeatureEnabled =
    lookDetail?.lookType === Look.Avatar ? isAvatarLooksEnabled : enableMakeupAssets;

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
    <div style={{ width: '100%', maxWidth: '1800px', paddingRight: isXlScreen ? '10%' : '0%' }}>
      <VerificationAlert />
      <LookItemDetails
        lookDetail={lookDetail}
        name={name}
        description={description}
        setName={setName}
        setDescription={setDescription}
      />
      <Divider style={{ margin: '40px 0' }} />
      {!isIecLook && (
        <>
          <LookTotalPrice totalValue={lookDetail.totalValue ?? 0} />
          <Divider style={{ margin: '40px 0' }} />
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
